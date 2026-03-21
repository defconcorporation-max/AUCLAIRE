import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Mic, MicOff, Voicemail } from 'lucide-react';

interface DialerProps {
    isOpen: boolean;
    onClose: () => void;
    contactName: string;
    phoneNumber: string;
}

/** Mounted only while open — avoids setState-in-effect when resetting call UI */
function DialerOpen({
    onClose,
    contactName,
    phoneNumber,
}: Omit<DialerProps, 'isOpen'>) {
    const { t } = useTranslation();
    const [callState, setCallState] = useState<'idle' | 'calling' | 'connected' | 'ended'>('calling');
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    // Mock call timer behavior
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        let interval: ReturnType<typeof setInterval> | undefined;

        if (callState === 'calling') {
            timer = setTimeout(() => {
                setCallState('connected');
            }, 3000);
        }

        if (callState === 'connected') {
            interval = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        }

        return () => {
            if (timer) clearTimeout(timer);
            if (interval) clearInterval(interval);
        };
    }, [callState]);

    const handleStartCall = () => {
        setCallState('calling');
    };

    const handleEndCall = () => {
        setCallState('ended');
        setTimeout(() => {
            onClose();
        }, 2000);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <Dialog open onOpenChange={(open) => {
            if (!open && callState !== 'connected') {
                onClose();
            }
        }}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-black border-black/10 dark:border-white/10 shadow-2xl">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-xl font-serif text-center">
                        {callState === 'idle' ? t('dialer.titleIdle') :
                            callState === 'calling' ? t('dialer.titleCalling') :
                                callState === 'connected' ? t('dialer.titleConnected') : t('dialer.titleEnded')}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {callState === 'connected' ? (
                            <span className="text-green-500 font-mono text-lg font-bold block animate-pulse mt-2">{formatTime(duration)}</span>
                        ) : callState === 'calling' ? (
                            <span className="block mt-2 text-luxury-gold animate-bounce">{t('dialer.ringing')}</span>
                        ) : callState === 'ended' ? (
                            <span className="block mt-2 text-gray-500">{t('dialer.durationLabel', { time: formatTime(duration) })}</span>
                        ) : (
                            <span className="block mt-2 text-muted-foreground">{t('dialer.mockNote')}</span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center p-8 space-y-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-luxury-gold/20 to-luxury-gold/5 flex items-center justify-center border-2 border-luxury-gold/50 shadow-inner">
                        <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                            <span className="text-3xl font-serif text-luxury-gold">{contactName.charAt(0)}</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <h3 className="text-2xl font-serif font-semibold">{contactName}</h3>
                        <p className="text-xl font-mono mt-2 tracking-wider text-muted-foreground">{phoneNumber}</p>
                    </div>

                    <div className="flex items-center gap-6 mt-8">
                        {callState === 'connected' && (
                            <Button
                                variant="outline"
                                size="icon"
                                className={`w-14 h-14 rounded-full border-2 ${isMuted ? 'bg-red-500/10 text-red-500 border-red-500/50' : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10'}`}
                                onClick={() => setIsMuted(!isMuted)}
                            >
                                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                            </Button>
                        )}

                        {callState === 'idle' ? (
                            <Button
                                onClick={handleStartCall}
                                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30 text-white animate-in zoom-in"
                            >
                                <Phone className="w-7 h-7" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleEndCall}
                                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 text-white animate-in zoom-in"
                                disabled={callState === 'ended'}
                            >
                                <PhoneOff className="w-7 h-7" />
                            </Button>
                        )}

                        {callState === 'connected' && (
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-14 h-14 rounded-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10"
                            >
                                <Voicemail className="w-6 h-6" />
                            </Button>
                        )}
                    </div>
                </div>

                {callState === 'connected' && (
                    <div className="bg-red-500/10 text-red-500 text-xs text-center py-2 px-4 rounded-b-lg flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        {t('dialer.recordingNotice')}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default function Dialer({ isOpen, onClose, contactName, phoneNumber }: DialerProps) {
    if (!isOpen) return null;
    return (
        <DialerOpen
            key={`${phoneNumber}-${contactName}`}
            onClose={onClose}
            contactName={contactName}
            phoneNumber={phoneNumber}
        />
    );
}
