
export interface PickerResult {
  action: string;
  docs?: Array<{
    id: string;
    name: string;
    mimeType: string;
    url: string;
    lastEditedUtc: number;
    iconUrl: string;
    parentId: string;
  }>;
}

declare const google: {
  picker: {
    DocsView: new (id: string) => unknown;
    ViewId: { DOCS: string };
    Feature: {
      NAV_HIDDEN: string;
      MULTISELECT_ENABLED: string;
    };
    DocsUploadView: new () => unknown;
    PickerBuilder: new () => unknown;
  };
};
declare const gapi: {
  load: (api: string, config: { callback: () => void; onerror: () => void }) => void;
};

let pickerApiLoaded = false;

export const loadPickerApi = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (pickerApiLoaded) {
      resolve();
      return;
    }

    // Load GAPI
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      gapi.load('picker', {
        callback: () => {
          pickerApiLoaded = true;
          resolve();
        },
        onerror: () => reject(new Error('Picker API failed to load')),
      });
    };
    script.onerror = () => reject(new Error('GAPI script failed to load'));
    document.body.appendChild(script);
  });
};

export const showPicker = async (accessToken: string, callback: (result: PickerResult) => void) => {
  await loadPickerApi();

  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || ''; // Needs to be set in .env
  const appId = import.meta.env.VITE_GOOGLE_APP_ID || ''; // Project Number (optional but recommended)

  const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
    .setMimeTypes('application/pdf,image/png,image/jpeg,application/vnd.google-apps.document,application/vnd.google-apps.spreadsheet');

  const picker = new google.picker.PickerBuilder()
    .enableFeature(google.picker.Feature.NAV_HIDDEN)
    .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
    .setDeveloperKey(apiKey)
    .setAppId(appId)
    .setOAuthToken(accessToken)
    .addView(view)
    .addView(new google.picker.DocsUploadView())
    .setCallback(callback)
    .build();

  picker.setVisible(true);
};
