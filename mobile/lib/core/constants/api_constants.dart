const String kAndroidHost = String.fromEnvironment(
  'TASKFLOW_ANDROID_HOST',
  defaultValue: 'localhost',
);
const String kApiBaseUrlOverride = String.fromEnvironment(
  'TASKFLOW_API_BASE_URL',
  defaultValue: '',
);
const String kAiBaseUrlOverride = String.fromEnvironment(
  'TASKFLOW_AI_BASE_URL',
  defaultValue: '',
);
const String kApiBaseUrlAndroid = 'http://$kAndroidHost:5000/api';
const String kApiBaseUrlIOS = 'http://localhost:5000/api';
const String kAiBaseUrlAndroid = 'http://$kAndroidHost:8000';
const String kAiBaseUrlIOS = 'http://localhost:8000';
const String kTokenStorageKey = 'taskflow_jwt';
