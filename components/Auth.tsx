import React, { useState } from 'react';
import { GoogleIcon, MailIcon, LockIcon } from './icons';
import { User } from '../App';
import { useLanguage } from './LanguageContext';
import { auth, db } from '../firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc, getDocs, collection, query, where, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase-errors';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { t } = useLanguage();

  // User for DEV environment as requested
  const devAdminUser = {
    id: 'user-1',
    name: 'Hung Thai',
    email: 'hungthai84@gmail.com',
    role: 'superadmin' as const,
    password: '123456',
    avatar: 'https://i.pravatar.cc/150?u=8'
  };

  // Pre-fill credentials for DEV environment
  const [email, setEmail] = useState(devAdminUser.email);
  const [password, setPassword] = useState(devAdminUser.password);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError('');
    setMessage('');
    
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/calendar.events');
      provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
      provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
          (window as unknown as { _googleAccessToken?: string })._googleAccessToken = credential.accessToken;
      }
      const googleUser = result.user;
      
      // Check if user exists in Firestore
      const userRef = doc(db, 'users', googleUser.uid);
      const userSnap = await getDoc(userRef);
      
      let finalUser: User;
      
      if (!userSnap.exists()) {
        // Query if an administrator preassigned a user with this email beforehand
        let preassignedRole: User['role'] = googleUser.email === devAdminUser.email ? 'superadmin' : 'member';
        let preassignedName = googleUser.displayName || 'Nhân viên mới';
        let preassignedPhone = '';
        
        try {
          const q = query(collection(db, 'users'), where('email', '==', googleUser.email));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            const adminCreatedDoc = qSnap.docs[0];
            const dataToMigrate = adminCreatedDoc.data();
            preassignedRole = (dataToMigrate.role as User['role']) || preassignedRole;
            preassignedName = dataToMigrate.name || preassignedName;
            preassignedPhone = dataToMigrate.phoneNumber || '';
            
            // Delete the temporary user document to prevent duplicates
            if (adminCreatedDoc.id !== googleUser.uid) {
              await deleteDoc(doc(db, 'users', adminCreatedDoc.id));
            }
          }
        } catch (dbErr) {
          console.error("Migration error checking existing email:", dbErr);
        }

        // Create new employee record
        const newUser: User = {
          id: googleUser.uid,
          name: preassignedName,
          email: googleUser.email || '',
          role: preassignedRole,
          avatar: googleUser.photoURL || 'https://i.pravatar.cc/150?u=' + googleUser.uid,
          phoneNumber: preassignedPhone || undefined,
          isGoogleLinked: true,
          googleEmail: googleUser.email || ''
        };
        
        try {
          await setDoc(userRef, {
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            avatar: newUser.avatar,
            phoneNumber: newUser.phoneNumber || '',
            isGoogleLinked: true,
            googleEmail: newUser.googleEmail,
            createdAt: serverTimestamp(),
          });
        } catch (dbErr) {
          handleFirestoreError(dbErr, OperationType.WRITE, 'users/' + googleUser.uid);
        }
        
        finalUser = newUser;
      } else {
        const data = userSnap.data();
        finalUser = {
            id: googleUser.uid,
            name: data.name || googleUser.displayName || 'User',
            email: data.email || googleUser.email || '',
            role: (data.role as User['role']) || 'member',
            avatar: data.avatar || googleUser.photoURL || 'https://i.pravatar.cc/150?u=' + googleUser.uid,
            phoneNumber: data.phoneNumber,
            isGoogleLinked: data.isGoogleLinked ?? true,
            googleEmail: data.googleEmail || googleUser.email || ''
        };
        
        // Ensure firestore is in sync
        if (!data.isGoogleLinked) {
            try {
                await updateDoc(userRef, {
                    isGoogleLinked: true,
                    googleEmail: googleUser.email || ''
                });
            } catch { /* ignore */ }
        }
      }
      
      onLogin(finalUser);
    } catch (err) {
      console.error("Google Auth Error:", err);
      const errCode = (err as { code?: string }).code || '';
      const errMsg = (err as Error).message || 'Lỗi không xác định';
      if (errCode === 'auth/popup-blocked') {
        setError('Trình duyệt đã chặn cửa sổ đăng nhập. Vui lòng bật nó và thử lại.');
      } else if (errCode === 'auth/cancelled-popup-request') {
        setError('Yêu cầu đăng nhập đã bị hủy hoặc đang chờ xử lý.');
      } else if (errCode === 'auth/popup-closed-by-user' || errCode === 'auth/cancelled-by-user') {
        setIsLoading(false);
        return;
      } else {
        setError('Đăng nhập Google thất bại: ' + errMsg);
      }
      
      // Fallback for development if Google Auth fails or is blocked by iframe
      if (errCode !== 'auth/popup-closed-by-user') {
          setTimeout(async () => {
              try {
                  await signInWithEmailAndPassword(auth, devAdminUser.email, devAdminUser.password);
              } catch {
                  try {
                      await createUserWithEmailAndPassword(auth, devAdminUser.email, devAdminUser.password);
                  } catch { /* ignore */ }
              }
              onLogin({
                  id: auth.currentUser?.uid || devAdminUser.id,
                  name: devAdminUser.name,
                  email: devAdminUser.email,
                  role: devAdminUser.role,
                  avatar: devAdminUser.avatar,
              });
          }, 1500);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      if (isLoginView) {
        // Login logic
        if (email.toLowerCase() === devAdminUser.email && password === devAdminUser.password) {
          try {
              await signInWithEmailAndPassword(auth, email, password);
          } catch (fbErr) {
              const fbErrCode = (fbErr as { code?: string }).code || '';
              if (fbErrCode === 'auth/user-not-found' || fbErrCode === 'auth/invalid-credential') {
                  try {
                      await createUserWithEmailAndPassword(auth, email, password);
                  } catch { /* ignore */ }
              }
          }
          onLogin({
            id: auth.currentUser?.uid || devAdminUser.id,
            name: devAdminUser.name,
            email: devAdminUser.email,
            role: devAdminUser.role,
            avatar: devAdminUser.avatar,
          });
          return;
        }

        const result = await signInWithEmailAndPassword(auth, email, password);
        if (!result.user.emailVerified) {
          setError(t('pleaseVerifyEmail'));
          // Optionally resend email
          await sendEmailVerification(result.user);
          return;
        }

        onLogin({
          id: result.user.uid,
          name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
          email: result.user.email || '',
          role: result.user.email === devAdminUser.email ? 'superadmin' : 'user',
          avatar: result.user.photoURL || 'https://i.pravatar.cc/150?u=' + result.user.uid,
        });

      } else {
        // Sign-up logic
        if (password !== confirmPassword) {
          setError('Mật khẩu không khớp.');
          setIsLoading(false);
          return;
        }

        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create user record in Firestore
        await setDoc(doc(db, 'users', result.user.uid), {
          name: email.split('@')[0],
          email: email,
          role: email === devAdminUser.email ? 'superadmin' : 'member',
          avatar: 'https://i.pravatar.cc/150?u=' + result.user.uid,
          createdAt: serverTimestamp(),
        });

        await sendEmailVerification(result.user);
        
        setMessage(t('verificationSent'));
        setIsLoginView(true);
      }
    } catch (err) {
      console.error("Auth Error:", err);
      const errMsg = (err as Error).message || 'Lỗi không xác định';
      setError('Lỗi xác thực: ' + errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full font-sans">
      <div className="absolute inset-0 bg-[--color-background-body] z-0"></div>
      <div className="w-full max-w-md p-8 space-y-8 bg-[--color-surface-primary] backdrop-blur-xl rounded-2xl shadow-2xl z-10 m-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[--color-text-primary]">
            {isLoginView ? t('welcomeBack') : t('createYourAccount')}
          </h2>
          <p className="mt-2 text-sm text-[--color-text-secondary]">
            {isLoginView ? t('signInToContinue') : t('getStarted')}
          </p>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-3 py-3 px-4 bg-[--color-surface-tertiary] hover:bg-[--color-surface-solid] rounded-lg border border-[--color-border-secondary] shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[--color-accent-400] focus:ring-opacity-75 transform hover:scale-105 ${isLoading ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-[--color-accent-500] border-t-transparent rounded-full animate-spin"></div>
              <span className="font-semibold text-[--color-text-secondary]">Đang xử lý...</span>
            </div>
          ) : (
            <>
              <GoogleIcon className="w-6 h-6" />
              <span className="font-semibold text-[--color-text-secondary]">{t('signInWithGoogle')}</span>
            </>
          )}
        </button>

        <div className="flex items-center">
          <hr className="flex-grow border-t border-[--color-border-secondary]" />
          <span className="mx-4 text-xs font-medium text-[--color-text-subtle]">{t('or')}</span>
          <hr className="flex-grow border-t border-[--color-border-secondary]" />
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
           {error && (
              <div className="p-3 text-center rounded-md bg-[--color-destructive-bg] text-[--color-destructive-fg] font-medium text-sm animate-shake">
                  {error}
              </div>
            )}
            
           {message && (
              <div className="p-3 text-center rounded-md bg-emerald-100 text-emerald-800 font-medium text-sm transition-all">
                  {message}
              </div>
            )}

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MailIcon className="h-5 w-5 text-[--color-text-subtle]" />
            </div>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailAddress')}
              className="w-full bg-[--color-surface-primary] border border-transparent focus:bg-[--color-surface-secondary] focus:border-[--color-accent-400] focus:ring-0 focus:outline-none placeholder:text-[--color-text-subtle] text-[--color-text-primary] rounded-lg py-3 pl-12 pr-4 transition-all duration-300"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <LockIcon className="h-5 w-5 text-[--color-text-subtle]" />
            </div>
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('password')}
              className="w-full bg-[--color-surface-primary] border border-transparent focus:bg-[--color-surface-secondary] focus:border-[--color-accent-400] focus:ring-0 focus:outline-none placeholder:text-[--color-text-subtle] text-[--color-text-primary] rounded-lg py-3 pl-12 pr-4 transition-all duration-300"
            />
          </div>
          {!isLoginView && (
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockIcon className="h-5 w-5 text-[--color-text-subtle]" />
                </div>
                <input
                  type="password"
                  name="confirm-password"
                  id="confirm-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('confirmPassword')}
                  className="w-full bg-[--color-surface-primary] border border-transparent focus:bg-[--color-surface-secondary] focus:border-[--color-accent-400] focus:ring-0 focus:outline-none placeholder:text-[--color-text-subtle] text-[--color-text-primary] rounded-lg py-3 pl-12 pr-4 transition-all duration-300"
                />
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 bg-gradient-to-br from-[--color-accent-500] to-[--color-accent-gradient-secondary] text-white font-bold rounded-lg shadow-lg hover:shadow-accent-500/40 dark:hover:shadow-[--color-accent-shadow] focus:outline-none focus:ring-2 focus:ring-[--color-accent-400] focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? '...' : (isLoginView ? t('login') : t('createAccount'))}
          </button>
        </form>

        <p className="text-center text-sm text-[--color-text-secondary]">
          {isLoginView ? t('dontHaveAccount') : t('alreadyHaveAccount')}
          <button onClick={() => { setIsLoginView(!isLoginView); setError(''); setMessage(''); }} className="font-semibold text-[--color-accent-600] hover:text-[--color-accent-700] ml-2 focus:outline-none">
            {isLoginView ? t('signUp') : t('login')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;