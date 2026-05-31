
interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}

interface GoogleIdentityServices {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string | undefined;
        scope: string;
        callback: (response: TokenResponse) => void;
      }) => {
        requestAccessToken: () => void;
      };
    };
  };
}

declare const google: GoogleIdentityServices;

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/tasks.readonly'
].join(' ');

let accessToken: string | null = null;
let tokenExpirationTime: number | null = null;

export const getAccessToken = (): Promise<string> => {
  if (accessToken && tokenExpirationTime && Date.now() < tokenExpirationTime) {
    return Promise.resolve(accessToken);
  }

  return new Promise((resolve, reject) => {
    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: TokenResponse) => {
          if (response.access_token) {
            accessToken = response.access_token;
            // Access tokens typically last 1 hour (3600 seconds)
            tokenExpirationTime = Date.now() + (response.expires_in || 3600) * 1000 - 60000; // 1 minute buffer
            resolve(response.access_token);
          } else {
            reject(new Error('Failed to get access token: ' + (response.error || 'Unknown error')));
          }
        },
      });
      client.requestAccessToken();
    } catch (error) {
      reject(error);
    }
  });
};

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: 'needsAction' | 'completed';
  updated: string;
}

export interface GoogleTaskList {
  id: string;
  title: string;
  updated: string;
}

export const fetchTaskLists = async (token: string): Promise<GoogleTaskList[]> => {
  const response = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch task lists');
  const data = await response.json();
  return data.items || [];
};

export const fetchTasks = async (token: string, listId: string): Promise<GoogleTask[]> => {
  const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch tasks');
  const data = await response.json();
  return data.items || [];
};

export const updateTaskStatus = async (token: string, listId: string, taskId: string, completed: boolean): Promise<void> => {
    const status = completed ? 'completed' : 'needsAction';
    const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update task status');
};

export const createGoogleTask = async (token: string, listId: string, title: string, notes?: string, due?: string): Promise<GoogleTask> => {
    const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            title, 
            notes, 
            due: due ? `${due}T00:00:00Z` : undefined 
        })
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
};

export const deleteGoogleTask = async (token: string, listId: string, taskId: string): Promise<void> => {
    const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!response.ok) throw new Error('Failed to delete task');
};
