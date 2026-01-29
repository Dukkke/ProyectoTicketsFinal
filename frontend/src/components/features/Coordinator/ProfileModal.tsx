import { useState, useEffect } from 'react';
import { User, uploadAvatar, updateProfile } from '@/lib/api';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onSuccess: (updatedUser: User) => void;
}

export function ProfileModal({ isOpen, onClose, user, onSuccess }: ProfileModalProps) {
    const [profileForm, setProfileForm] = useState({
        phone: '',
        office: '',
        bio: '',
        personal_email: ''
    });
    const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user && isOpen) {
            setProfileForm({
                phone: user.phone || '',
                office: user.office || '',
                bio: user.bio || '',
                personal_email: user.personal_email || ''
            });
            setProfilePhotoPreview(null);
            setSelectedFile(null);
            setError('');
        }
    }, [user, isOpen]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setError('');

        try {
            let updatedUser = user;

            // 1. Upload photo if changed
            if (selectedFile) {
                const { profile_photo } = await uploadAvatar(user.id, selectedFile);
                updatedUser = { ...updatedUser, profile_photo };
            }

            // 2. Update profile data
            const finalUser = await updateProfile(user.id, profileForm);

            // Combine results (photo update might not be returned by updateProfile if run sequentially separately)
            // But updateProfile returns the user. Ideally we should pass the new photo to updateProfile if needed?
            // Actually, uploadAvatar updates the user in DB. updateProfile updates other fields.
            // If we run uploadAvatar first, the DB has the new photo.
            // Then updateProfile fetches the user, updates text fields, and returns it.
            // So finalUser should have both.

            onSuccess(finalUser);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200
        }}>
            <div style={{
                background: 'white', borderRadius: '24px',
                width: '95%', maxWidth: '500px', maxHeight: '90vh',
                overflowY: 'auto', padding: '0',
                boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px', borderBottom: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                        ⚙️ Editar Perfil
                    </h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: '24px', color: '#94a3b8', cursor: 'pointer' }}
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {error && (
                        <div style={{ padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '12px', fontSize: '14px' }}>
                            {error}
                        </div>
                    )}

                    {/* Profile Photo Section */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '100px', height: '100px',
                            borderRadius: '50%', margin: '0 auto 16px',
                            background: profilePhotoPreview || user?.profile_photo
                                ? `url(${profilePhotoPreview || user?.profile_photo}) center/cover`
                                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: '36px', fontWeight: 'bold',
                            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
                            border: '4px solid white'
                        }}>
                            {!(profilePhotoPreview || user?.profile_photo) && (user?.name?.charAt(0) || 'C')}
                        </div>
                        <label style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', borderRadius: '30px',
                            background: '#f1f5f9', color: '#4f46e5',
                            cursor: 'pointer', fontWeight: '600', fontSize: '14px',
                            transition: 'all 0.2s'
                        }}>
                            📷 Cambiar Foto
                            <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>

                    {/* Contact Information */}
                    <div>
                        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '16px', textTransform: 'uppercase' }}>
                            📞 Información de Contacto
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    value={profileForm.phone}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="+56 9 1234 5678"
                                    style={{
                                        width: '100%', padding: '12px 16px',
                                        border: '1px solid #e2e8f0', borderRadius: '12px',
                                        fontSize: '14px', color: '#1e293b'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                                    Correo Personal
                                </label>
                                <input
                                    type="email"
                                    value={profileForm.personal_email}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, personal_email: e.target.value }))}
                                    placeholder="correo@personal.com"
                                    style={{
                                        width: '100%', padding: '12px 16px',
                                        border: '1px solid #e2e8f0', borderRadius: '12px',
                                        fontSize: '14px', color: '#1e293b'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                                    Oficina
                                </label>
                                <input
                                    type="text"
                                    value={profileForm.office}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, office: e.target.value }))}
                                    placeholder="Ej: Edificio A, Oficina 203"
                                    style={{
                                        width: '100%', padding: '12px 16px',
                                        border: '1px solid #e2e8f0', borderRadius: '12px',
                                        fontSize: '14px', color: '#1e293b'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    <div>
                        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '16px', textTransform: 'uppercase' }}>
                            📝 Acerca de ti
                        </h3>
                        <textarea
                            value={profileForm.bio}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                            placeholder="Cuéntanos un poco sobre ti..."
                            rows={3}
                            style={{
                                width: '100%', padding: '12px 16px',
                                border: '1px solid #e2e8f0', borderRadius: '12px',
                                fontSize: '14px', color: '#1e293b', resize: 'vertical'
                            }}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px', borderTop: '1px solid #e2e8f0',
                    display: 'flex', gap: '12px', justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '12px 24px', borderRadius: '12px',
                            border: '1px solid #e2e8f0', background: 'white',
                            color: '#64748b', fontWeight: '600', cursor: 'pointer'
                        }}
                        disabled={saving}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            padding: '12px 24px', borderRadius: '12px',
                            border: 'none', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                            color: 'white', fontWeight: '600', cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                            opacity: saving ? 0.7 : 1
                        }}
                    >
                        {saving ? 'Guardando...' : '💾 Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
}
