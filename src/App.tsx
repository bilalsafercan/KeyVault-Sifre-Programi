import { useState, useEffect } from 'react';
import { canUseRecoveryCode, markCodeAsUsed } from './recoveryHashes';

// Types
interface Record {
  id: string;
  category: 'password' | 'command' | 'note' | 'other';
  title: string;
  username?: string;
  password?: string;
  url?: string;
  content?: string;
  createdAt: number;
  updatedAt: number;
}

interface UserData {
  password: string;
  records: Record[];
  theme: string;
}

// Themes
const themes = {
  sky: { name: 'Gökyüzü', bg: 'bg-sky-50', primary: 'bg-sky-500', text: 'text-sky-600', border: 'border-sky-200', card: 'bg-white', isDark: false },
  mint: { name: 'Nane', bg: 'bg-emerald-50', primary: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200', card: 'bg-white', isDark: false },
  lavender: { name: 'Lavanta', bg: 'bg-purple-50', primary: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-200', card: 'bg-white', isDark: false },
  night: { name: 'Gece', bg: 'bg-slate-900', primary: 'bg-indigo-500', text: 'text-indigo-400', border: 'border-slate-700', card: 'bg-slate-800', isDark: true },
  forest: { name: 'Orman', bg: 'bg-gray-900', primary: 'bg-green-500', text: 'text-green-400', border: 'border-gray-700', card: 'bg-gray-800', isDark: true },
  amethyst: { name: 'Ametist', bg: 'bg-zinc-900', primary: 'bg-violet-500', text: 'text-violet-400', border: 'border-zinc-700', card: 'bg-zinc-800', isDark: true },
};

type ThemeKey = keyof typeof themes;

// Icons
const Icons = {
  Key: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
  Terminal: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Note: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Pin: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>,
  Plus: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Eye: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  EyeOff: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>,
  Copy: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Settings: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Home: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Download: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Upload: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  Shield: () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  X: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Check: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Lock: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
};

// Storage
const STORAGE_KEY = 'keyvault_data';

function loadData(): UserData {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return { password: 'admin', records: [], theme: 'sky' };
}

function saveData(data: UserData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Main App
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData>(loadData);
  const [activeTab, setActiveTab] = useState<'home' | 'settings'>('home');
  
  const theme = themes[userData.theme as ThemeKey] || themes.sky;

  useEffect(() => {
    saveData(userData);
  }, [userData]);

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveTab('home');
  };

  const updateUserData = (updates: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...updates }));
  };

  if (!isLoggedIn) {
    return <LoginScreen userData={userData} onLogin={handleLogin} updateUserData={updateUserData} />;
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.isDark ? 'text-white' : 'text-gray-900'} flex flex-col`}>
      {/* Main Content */}
      <div className="flex-1 pb-20 overflow-auto">
        {activeTab === 'home' ? (
          <HomeScreen userData={userData} updateUserData={updateUserData} theme={theme} />
        ) : (
          <SettingsScreen userData={userData} updateUserData={updateUserData} theme={theme} onLogout={handleLogout} />
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 ${theme.card} border-t ${theme.border} flex justify-around py-3 px-4 safe-area-pb`}>
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? theme.text : 'text-gray-400'}`}
        >
          <Icons.Home />
          <span className="text-xs">Kayıtlar</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? theme.text : 'text-gray-400'}`}
        >
          <Icons.Settings />
          <span className="text-xs">Ayarlar</span>
        </button>
      </nav>
    </div>
  );
}

// Login Screen
function LoginScreen({ userData, onLogin, updateUserData }: { userData: UserData; onLogin: () => void; updateUserData: (u: Partial<UserData>) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === userData.password) {
      onLogin();
    } else {
      setError('Kullanıcı adı veya şifre hatalı!');
    }
  };

  const handleRecovery = () => {
    const code = recoveryCode.toUpperCase().trim();
    const result = canUseRecoveryCode(code);
    
    if (!result.valid) {
      setRecoveryError('Geçersiz recovery kodu!');
      return;
    }
    
    if (result.used) {
      setRecoveryError('Bu kod daha önce bu cihazda kullanılmış!');
      return;
    }
    
    // Kodu kullanılmış olarak işaretle ve şifreyi sıfırla
    markCodeAsUsed(code);
    updateUserData({ password: 'admin' });
    setRecoverySuccess(true);
    setRecoveryError('');
    
    setTimeout(() => {
      setShowRecovery(false);
      setRecoveryCode('');
      setRecoverySuccess(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4">
            <Icons.Shield />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">KeyVault</h1>
          <p className="text-gray-500 text-sm mt-1">Güvenli Şifre Yöneticisi</p>
        </div>

        {!showRecovery ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı</label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                </button>
              </div>
            </div>
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Giriş Yap
            </button>

            <button
              type="button"
              onClick={() => setShowRecovery(true)}
              className="w-full text-sm text-indigo-600 hover:text-indigo-800"
            >
              Şifremi Unuttum
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <Icons.Lock />
              <h2 className="text-lg font-semibold text-gray-900 mt-2">Şifre Sıfırlama</h2>
              <p className="text-gray-500 text-sm mt-1">Recovery kodunuzu girin</p>
            </div>
            
            <input
              type="text"
              value={recoveryCode}
              onChange={e => { setRecoveryCode(e.target.value.toUpperCase()); setRecoveryError(''); }}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-center text-lg tracking-widest"
              placeholder="XXXX000XXX"
              maxLength={10}
            />
            
            {recoveryError && <p className="text-red-500 text-sm text-center">{recoveryError}</p>}
            {recoverySuccess && <p className="text-green-500 text-sm text-center">✓ Şifreniz "admin" olarak sıfırlandı!</p>}
            
            <button
              onClick={handleRecovery}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Şifreyi Sıfırla
            </button>
            
            <button
              onClick={() => { setShowRecovery(false); setRecoveryCode(''); setRecoveryError(''); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              ← Geri Dön
            </button>

            <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-500 text-center">
              📧 Recovery kodunuz yoksa:<br />
              <span className="text-indigo-600 font-medium">bilalsafercan@gmail.com</span>
			  <span className="gsm-indigo-600 font-medium">+90-539-741-0789</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Home Screen
function HomeScreen({ userData, updateUserData, theme }: { userData: UserData; updateUserData: (u: Partial<UserData>) => void; theme: typeof themes.sky }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const categories = [
    { key: 'all', label: 'Tümü', icon: null },
    { key: 'password', label: 'Şifreler', icon: <Icons.Key /> },
    { key: 'command', label: 'Komutlar', icon: <Icons.Terminal /> },
    { key: 'note', label: 'Notlar', icon: <Icons.Note /> },
    { key: 'other', label: 'Diğer', icon: <Icons.Pin /> },
  ];

  const filteredRecords = userData.records.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(search.toLowerCase()) ||
      record.username?.toLowerCase().includes(search.toLowerCase()) ||
      record.content?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || record.category === filter;
    return matchesSearch && matchesFilter;
  });

  const handleSave = (record: Record) => {
    if (editingRecord) {
      updateUserData({
        records: userData.records.map(r => r.id === record.id ? record : r)
      });
    } else {
      updateUserData({ records: [...userData.records, record] });
    }
    setShowForm(false);
    setEditingRecord(null);
  };

  const handleDelete = (id: string) => {
    updateUserData({ records: userData.records.filter(r => r.id !== id) });
    setDeleteConfirm(null);
    setExpandedId(null);
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'password': return <Icons.Key />;
      case 'command': return <Icons.Terminal />;
      case 'note': return <Icons.Note />;
      default: return <Icons.Pin />;
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Kayıtlarım</h1>
        <p className={`text-sm ${theme.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {userData.records.length} kayıt
        </p>
      </div>

      {/* Search */}
      <div className={`flex items-center gap-2 ${theme.card} rounded-xl px-4 py-3 mb-4 ${theme.border} border`}>
        <Icons.Search />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Ara..."
          className={`flex-1 bg-transparent outline-none ${theme.isDark ? 'placeholder-gray-500' : 'placeholder-gray-400'}`}
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setFilter(cat.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              filter === cat.key 
                ? `${theme.primary} text-white` 
                : `${theme.card} ${theme.border} border ${theme.isDark ? 'text-gray-300' : 'text-gray-600'}`
            }`}
          >
            {cat.icon}
            <span className="text-sm">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Records List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className={`text-center py-12 ${theme.card} rounded-2xl ${theme.border} border`}>
            <p className={theme.isDark ? 'text-gray-400' : 'text-gray-500'}>
              {search || filter !== 'all' ? 'Sonuç bulunamadı' : 'Henüz kayıt yok'}
            </p>
          </div>
        ) : (
          filteredRecords.map(record => (
            <div key={record.id} className={`${theme.card} rounded-2xl ${theme.border} border overflow-hidden`}>
              {/* Record Header */}
              <button
                onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div className={`w-10 h-10 rounded-xl ${theme.primary} text-white flex items-center justify-center`}>
                  {getCategoryIcon(record.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{record.title}</h3>
                  {record.username && (
                    <p className={`text-sm truncate ${theme.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {record.username}
                    </p>
                  )}
                </div>
                <svg 
                  className={`w-5 h-5 transition-transform ${expandedId === record.id ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded Content */}
              {expandedId === record.id && (
                <div className={`px-4 pb-4 space-y-3 border-t ${theme.border}`}>
                  {record.username && (
                    <div className="flex items-center justify-between pt-3">
                      <span className={`text-sm ${theme.isDark ? 'text-gray-400' : 'text-gray-500'}`}>Kullanıcı</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{record.username}</span>
                        <button
                          onClick={() => copyToClipboard(record.username!, `${record.id}-username`)}
                          className={`p-1.5 rounded-lg ${theme.isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                        >
                          {copiedField === `${record.id}-username` ? <Icons.Check /> : <Icons.Copy />}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {record.password && (
                    <PasswordField 
                      password={record.password} 
                      recordId={record.id}
                      theme={theme}
                      copiedField={copiedField}
                      onCopy={copyToClipboard}
                    />
                  )}
                  
                  {record.url && (
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${theme.isDark ? 'text-gray-400' : 'text-gray-500'}`}>URL</span>
                      <div className="flex items-center gap-2">
                        <a href={record.url} target="_blank" rel="noopener noreferrer" className={`${theme.text} underline truncate max-w-[200px]`}>
                          {record.url}
                        </a>
                        <button
                          onClick={() => copyToClipboard(record.url!, `${record.id}-url`)}
                          className={`p-1.5 rounded-lg ${theme.isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                        >
                          {copiedField === `${record.id}-url` ? <Icons.Check /> : <Icons.Copy />}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {record.content && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm ${theme.isDark ? 'text-gray-400' : 'text-gray-500'}`}>İçerik</span>
                        <button
                          onClick={() => copyToClipboard(record.content!, `${record.id}-content`)}
                          className={`p-1.5 rounded-lg ${theme.isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                        >
                          {copiedField === `${record.id}-content` ? <Icons.Check /> : <Icons.Copy />}
                        </button>
                      </div>
                      <p className={`text-sm ${theme.isDark ? 'bg-gray-700' : 'bg-gray-50'} p-3 rounded-xl whitespace-pre-wrap`}>
                        {record.content}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => { setEditingRecord(record); setShowForm(true); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl ${theme.isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                    >
                      <Icons.Edit />
                      <span>Düzenle</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(record.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-100 text-red-600"
                    >
                      <Icons.Trash />
                      <span>Sil</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Button */}
      <button
        onClick={() => { setEditingRecord(null); setShowForm(true); }}
        className={`fixed right-4 bottom-24 w-14 h-14 ${theme.primary} text-white rounded-full shadow-lg flex items-center justify-center`}
      >
        <Icons.Plus />
      </button>

      {/* Record Form Modal */}
      {showForm && (
        <RecordForm
          record={editingRecord}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingRecord(null); }}
          theme={theme}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.card} rounded-2xl p-6 max-w-sm w-full`}>
            <h3 className="text-lg font-semibold mb-2">Kaydı Sil?</h3>
            <p className={`text-sm mb-4 ${theme.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`flex-1 py-2 rounded-xl ${theme.isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
              >
                İptal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Password Field Component
function PasswordField({ password, recordId, theme, copiedField, onCopy }: {
  password: string;
  recordId: string;
  theme: typeof themes.sky;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  const [show, setShow] = useState(false);
  
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${theme.isDark ? 'text-gray-400' : 'text-gray-500'}`}>Şifre</span>
      <div className="flex items-center gap-2">
        <span className="font-mono">{show ? password : '••••••••'}</span>
        <button
          onClick={() => setShow(!show)}
          className={`p-1.5 rounded-lg ${theme.isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
        >
          {show ? <Icons.EyeOff /> : <Icons.Eye />}
        </button>
        <button
          onClick={() => onCopy(password, `${recordId}-password`)}
          className={`p-1.5 rounded-lg ${theme.isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
        >
          {copiedField === `${recordId}-password` ? <Icons.Check /> : <Icons.Copy />}
        </button>
      </div>
    </div>
  );
}

// Record Form Modal
function RecordForm({ record, onSave, onClose, theme }: {
  record: Record | null;
  onSave: (record: Record) => void;
  onClose: () => void;
  theme: typeof themes.sky;
}) {
  const [form, setForm] = useState({
    category: record?.category || 'password' as Record['category'],
    title: record?.title || '',
    username: record?.username || '',
    password: record?.password || '',
    url: record?.url || '',
    content: record?.content || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    
    const now = Date.now();
    onSave({
      id: record?.id || `rec_${now}`,
      ...form,
      createdAt: record?.createdAt || now,
      updatedAt: now,
    });
  };

  const categories = [
    { key: 'password', label: 'Şifre', icon: <Icons.Key /> },
    { key: 'command', label: 'Komut', icon: <Icons.Terminal /> },
    { key: 'note', label: 'Not', icon: <Icons.Note /> },
    { key: 'other', label: 'Diğer', icon: <Icons.Pin /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className={`${theme.card} w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-auto`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${theme.border} sticky top-0 ${theme.card}`}>
          <h2 className="text-lg font-semibold">
            {record ? 'Kaydı Düzenle' : 'Yeni Kayıt'}
          </h2>
          <button onClick={onClose} className="p-2">
            <Icons.X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Category */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Kategori
            </label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat.key as Record['category'] })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                    form.category === cat.key
                      ? `${theme.primary} text-white`
                      : `${theme.isDark ? 'bg-gray-700' : 'bg-gray-100'}`
                  }`}
                >
                  {cat.icon}
                  <span className="text-xs">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${theme.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Başlık *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border ${theme.border} ${theme.isDark ? 'bg-gray-700' : 'bg-white'} outline-none focus:ring-2 focus:ring-opacity-50`}
              placeholder="Örn: Gmail Hesabı"
              required
            />
          </div>

          {/* Username */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${theme.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Kullanıcı Adı
            </label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border ${theme.border} ${theme.isDark ? 'bg-gray-700' : 'bg-white'} outline-none focus:ring-2 focus:ring-opacity-50`}
              placeholder="Örn: user@gmail.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${theme.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Şifre
            </label>
            <input
              type="text"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border ${theme.border} ${theme.isDark ? 'bg-gray-700' : 'bg-white'} outline-none focus:ring-2 focus:ring-opacity-50 font-mono`}
              placeholder="••••••••"
            />
          </div>

          {/* URL */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${theme.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              URL
            </label>
            <input
              type="url"
              value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border ${theme.border} ${theme.isDark ? 'bg-gray-700' : 'bg-white'} outline-none focus:ring-2 focus:ring-opacity-50`}
              placeholder="https://"
            />
          </div>

          {/* Content */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${theme.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Not / İçerik
            </label>
            <textarea
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              rows={3}
              className={`w-full px-4 py-3 rounded-xl border ${theme.border} ${theme.isDark ? 'bg-gray-700' : 'bg-white'} outline-none focus:ring-2 focus:ring-opacity-50 resize-none`}
              placeholder="Ek notlar..."
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={`w-full py-3 ${theme.primary} text-white font-semibold rounded-xl`}
          >
            {record ? 'Kaydet' : 'Oluştur'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Settings Screen
function SettingsScreen({ userData, updateUserData, theme, onLogout }: {
  userData: UserData;
  updateUserData: (u: Partial<UserData>) => void;
  theme: typeof themes.sky;
  onLogout: () => void;
}) {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const handlePasswordChange = () => {
    if (currentPass !== userData.password) {
      setPassMsg({ type: 'error', text: 'Mevcut şifre hatalı!' });
      return;
    }
    if (newPass.length < 4) {
      setPassMsg({ type: 'error', text: 'Yeni şifre en az 4 karakter olmalı!' });
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg({ type: 'error', text: 'Şifreler eşleşmiyor!' });
      return;
    }
    updateUserData({ password: newPass });
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setPassMsg({ type: 'success', text: 'Şifre başarıyla değiştirildi!' });
    setTimeout(() => setPassMsg({ type: '', text: '' }), 3000);
  };

  const handleExport = () => {
    const data = JSON.stringify(userData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keyvault_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.records && Array.isArray(imported.records)) {
          updateUserData(imported);
          alert('Veriler başarıyla içe aktarıldı!');
        }
      } catch {
        alert('Geçersiz dosya formatı!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const themeList = Object.entries(themes);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Ayarlar</h1>

      {/* Install PWA */}
      {installPrompt && (
        <div className={`${theme.card} rounded-2xl p-4 ${theme.border} border`}>
          <h2 className="font-semibold mb-3">📱 Uygulamayı Yükle</h2>
          <p className={`text-sm mb-3 ${theme.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            KeyVault'u ana ekranınıza ekleyin
          </p>
          <button
            onClick={handleInstall}
            className={`w-full py-3 ${theme.primary} text-white font-semibold rounded-xl`}
          >
            Ana Ekrana Ekle
          </button>
        </div>
      )}

      {/* Themes */}
      <div className={`${theme.card} rounded-2xl p-4 ${theme.border} border`}>
        <h2 className="font-semibold mb-3">🎨 Tema</h2>
        <div className="grid grid-cols-3 gap-2">
          {themeList.map(([key, t]) => (
            <button
              key={key}
              onClick={() => updateUserData({ theme: key })}
              className={`p-3 rounded-xl border-2 transition-all ${
                userData.theme === key ? 'border-current' : 'border-transparent'
              } ${t.bg} ${t.isDark ? 'text-white' : 'text-gray-900'}`}
            >
              <div className={`w-6 h-6 rounded-full ${t.primary} mx-auto mb-1`} />
              <span className="text-xs">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div className={`${theme.card} rounded-2xl p-4 ${theme.border} border`}>
        <h2 className="font-semibold mb-3">🔐 Şifre Değiştir</h2>
        <div className="space-y-3">
          <input
            type="password"
            value={currentPass}
            onChange={e => setCurrentPass(e.target.value)}
            placeholder="Mevcut şifre"
            className={`w-full px-4 py-3 rounded-xl border ${theme.border} ${theme.isDark ? 'bg-gray-700' : 'bg-gray-50'} outline-none`}
          />
          <input
            type="password"
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
            placeholder="Yeni şifre"
            className={`w-full px-4 py-3 rounded-xl border ${theme.border} ${theme.isDark ? 'bg-gray-700' : 'bg-gray-50'} outline-none`}
          />
          <input
            type="password"
            value={confirmPass}
            onChange={e => setConfirmPass(e.target.value)}
            placeholder="Yeni şifre (tekrar)"
            className={`w-full px-4 py-3 rounded-xl border ${theme.border} ${theme.isDark ? 'bg-gray-700' : 'bg-gray-50'} outline-none`}
          />
          {passMsg.text && (
            <p className={`text-sm ${passMsg.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
              {passMsg.text}
            </p>
          )}
          <button
            onClick={handlePasswordChange}
            className={`w-full py-3 ${theme.primary} text-white font-semibold rounded-xl`}
          >
            Şifreyi Değiştir
          </button>
        </div>
      </div>

      {/* Backup */}
      <div className={`${theme.card} rounded-2xl p-4 ${theme.border} border`}>
        <h2 className="font-semibold mb-3">💾 Yedekleme</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExport}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl ${theme.isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
          >
            <Icons.Download />
            <span>Dışa Aktar</span>
          </button>
          <label className={`flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer ${theme.isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <Icons.Upload />
            <span>İçe Aktar</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full py-3 bg-red-500 text-white font-semibold rounded-xl"
      >
        Çıkış Yap
      </button>

      {/* Version */}
      <p className={`text-center text-sm ${theme.isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        KeyVault v1.0.0
      </p>
    </div>
  );
}
