import React, { useState, useEffect } from 'react';
import { Logo } from '../constants';
import { signUpWithEmail, signInWithEmail } from '../services/firebaseService';
import { createUserProfile, checkUsernameAvailability } from '../services/firestoreService';
import { meAvatar } from '../assets';

interface AuthScreenProps {
    onLogin: (email: string, userId: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [usernameError, setUsernameError] = useState<string | null>(null);

    // Check username availability when typing (debounced)
    useEffect(() => {
        if (!isSignUp || !username || username.length < 3) {
            setUsernameError(null);
            return;
        }

        const timeoutId = setTimeout(async () => {
            const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
            if (cleanUsername.length < 3) {
                setUsernameError('Username must be at least 3 characters');
                return;
            }

            // Validate username format (alphanumeric and underscores only)
            if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
                setUsernameError('Username can only contain letters, numbers, and underscores');
                return;
            }

            try {
                const isAvailable = await checkUsernameAvailability(cleanUsername);
                if (!isAvailable) {
                    setUsernameError('Username is already taken');
                } else {
                    setUsernameError(null);
                }
            } catch (error) {
                setUsernameError('Error checking username');
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [username, isSignUp]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            let user;
            if (isSignUp) {
                // Validate signup fields
                if (!name.trim()) {
                    setError('Please enter your name');
                    setIsLoading(false);
                    return;
                }

                const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
                if (!cleanUsername || cleanUsername.length < 3) {
                    setError('Please enter a valid username (at least 3 characters)');
                    setIsLoading(false);
                    return;
                }

                if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
                    setError('Username can only contain letters, numbers, and underscores');
                    setIsLoading(false);
                    return;
                }

                // Check username availability one more time
                const isAvailable = await checkUsernameAvailability(cleanUsername);
                if (!isAvailable) {
                    setError('Username is already taken. Please choose another.');
                    setIsLoading(false);
                    return;
                }

                // Sign up new user
                user = await signUpWithEmail(email, password);
                
                // Create user profile in Firestore with provided username
                await createUserProfile(user.uid, {
                    name: name.trim(),
                    email: email,
                    avatar: meAvatar,
                    username: `@${cleanUsername}`,
                });
            } else {
                // Sign in existing user
                user = await signInWithEmail(email, password);
            }
            
            // Success - call onLogin with email and user ID
            onLogin(email, user.uid);
        } catch (err: any) {
            console.error('Auth error:', err);
            setError(err.message || "Authentication failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-white font-sans overflow-hidden relative pt-safe">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="auth-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                            <circle cx="50" cy="50" r="2" fill="currentColor" />
                            <path d="M10 10l20 20M40 5l10 10M80 80l15 15" stroke="currentColor" fill="none" strokeWidth="2" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#auth-pattern)" />
                </svg>
            </div>

            <div className="z-10 w-full max-w-sm px-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="mb-12">
                     <Logo className="h-16 w-auto" />
                </div>

                <div className="w-full bg-white rounded-[40px] p-1 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">
                    <div className="p-8 pt-10">
                        <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="text-center space-y-2 mb-8">
                                <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                                    {isSignUp ? 'Create Account' : 'Welcome Back'}
                                </h1>
                                    <p className="text-[14px] font-bold text-slate-400 px-4 leading-relaxed">
                                    {isSignUp 
                                        ? 'Enter your details to create your account. Choose a unique username that others can search for.'
                                        : 'Enter your email and password to continue messaging.'
                                    }
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <input 
                                        type="email" 
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent focus:border-green-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-base"
                                        autoFocus={!isSignUp}
                                        disabled={isLoading}
                                        required
                                    />
                                </div>

                                {isSignUp && (
                                    <div>
                                        <input 
                                            type="text" 
                                            placeholder="Full Name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent focus:border-green-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-base"
                                            disabled={isLoading}
                                            required={isSignUp}
                                        />
                                    </div>
                                )}

                                {isSignUp && (
                                    <div>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                placeholder="Username (e.g., johndoe or @johndoe)"
                                                value={username}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^a-zA-Z0-9_@]/g, '');
                                                    setUsername(value);
                                                }}
                                                className={`w-full px-4 py-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all font-bold text-base ${
                                                    usernameError 
                                                        ? 'border-red-500 focus:border-red-500' 
                                                        : 'border-transparent focus:border-green-500'
                                                } focus:bg-white`}
                                                disabled={isLoading}
                                                required={isSignUp}
                                                minLength={3}
                                            />
                                            {username && !usernameError && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        {usernameError && (
                                            <p className="text-xs text-red-500 font-bold px-2 mt-1">{usernameError}</p>
                                        )}
                                        {username && !usernameError && username.length >= 3 && (
                                            <p className="text-xs text-green-500 font-bold px-2 mt-1">✓ Username available</p>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <input 
                                        type="password" 
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent focus:border-green-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-base"
                                        disabled={isLoading}
                                        required
                                        minLength={6}
                                    />
                                </div>

                                {error && <p className="text-xs text-red-500 font-bold px-2">{error}</p>}
                                </div>

                                <button 
                                    type="submit"
                                disabled={
                                    !email || 
                                    !password || 
                                    password.length < 6 || 
                                    isLoading ||
                                    (isSignUp && (!name.trim() || !username || username.length < 3 || !!usernameError))
                                }
                                    className="w-full py-4.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-black text-[16px] shadow-xl shadow-green-100 transition-all active:scale-95 flex items-center justify-center space-x-2"
                                >
                                <span>{isLoading ? (isSignUp ? "Creating..." : "Signing in...") : (isSignUp ? "Sign Up" : "Sign In")}</span>
                                    {!isLoading && (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    )}
                                </button>

                                <button 
                                    type="button"
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setError(null);
                                    setPassword('');
                                    setName('');
                                    setUsername('');
                                    setUsernameError(null);
                                }}
                                    className="w-full text-sm font-black text-green-600 hover:underline uppercase tracking-widest"
                                    disabled={isLoading}
                                >
                                {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                                </button>
                            </form>
                    </div>
                </div>

                <p className="mt-12 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center max-w-[240px] leading-loose">
                    By continuing, you agree to our <span className="text-slate-800">Terms of Service</span> and <span className="text-slate-800">Privacy Policy</span>.
                </p>
            </div>
        </div>
    );
};
