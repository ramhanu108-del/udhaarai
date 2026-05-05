import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, Cloud, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/useStore';

export const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Profile fields for signup
  const [ownerName, setOwnerName] = useState('');
  const [shopName, setShopName] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await authService.signIn(email, password);
        navigate('/account-sync');
      } else {
        await authService.signUp(email, password, {
          owner_name: ownerName,
          shop_name: shopName,
          business_type: 'kirana',
          language: 'en'
        });
        navigate('/account-sync');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{isLogin ? 'Login Karo' : 'Account Banao'}</h1>
            <p className="text-xs text-slate-500 font-medium">Cloud auto-sync & backup</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
         <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-8 text-center flex flex-col items-center">
            <Cloud className="w-10 h-10 text-indigo-500 mb-3" />
            <h2 className="text-sm font-bold text-indigo-900 mb-1">Data Cloud mein safe rahega</h2>
            <p className="text-xs text-indigo-700/80 font-medium">Offline mode bhi kaam karega bina internet ke.</p>
         </div>

         {error && (
            <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl mb-6">
              {error}
            </div>
         )}

         <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                 <div>
                   <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 block">Aapka Naam</label>
                   <Input value={ownerName} onChange={e => setOwnerName(e.target.value)} required placeholder="Ramesh Kumar" />
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 block">Shop Name</label>
                   <Input value={shopName} onChange={e => setShopName(e.target.value)} required placeholder="Ramesh Kirana Store" />
                 </div>
              </>
            )}
            <div>
               <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 block">Email</label>
               <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="ramesh@example.com" />
            </div>
            <div>
               <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 block">Password</label>
               <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 mt-4 shadow-sm">
               {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
            </Button>
         </form>

         <div className="mt-8 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-xs font-bold text-indigo-600">
               {isLogin ? "Naya account banana hai? Sign up" : "Pehle se account hai? Login karein"}
            </button>
         </div>
         
         <div className="mt-12 flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Safe & Secure
         </div>
      </div>
    </div>
  );
};
