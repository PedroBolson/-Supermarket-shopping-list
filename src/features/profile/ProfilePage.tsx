import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { updateProfile } from 'firebase/auth'
import { Camera, Check, Loader2, ShieldCheck } from 'lucide-react'
import { Button, Card, Input, Avatar, TextArea } from '../../components/ui'
import { useAuth } from '../../hooks/use-auth'
import { uploadAvatar, updateUserProfileDocument } from './services'

type Feedback = { type: 'success' | 'error'; message: string }

export function ProfilePage() {
  const { profile, authUser } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.name ?? '')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setDisplayName(profile?.name ?? '')
    setBio(profile?.bio ?? '')
  }, [profile?.name, profile?.bio])

  const statusLabel = useMemo(() => (profile?.isActive ? 'Acesso liberado' : 'Aguardando aprovação'), [
    profile?.isActive,
  ])

  if (!profile || !authUser) {
    return null
  }

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!displayName.trim()) {
      setFeedback({ type: 'error', message: 'Informe seu nome completo.' })
      return
    }

    try {
      setSaving(true)
      await updateUserProfileDocument(profile.uid, { name: displayName.trim(), bio: bio.trim() })
      await updateProfile(authUser, { displayName: displayName.trim() })
      setFeedback({ type: 'success', message: 'Perfil atualizado com sucesso.' })
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', message: 'Não foi possível atualizar seu perfil.' })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Selecione um arquivo de imagem válido.' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'A imagem deve ter no máximo 5MB.' })
      return
    }

    try {
      setUploading(true)
      setUploadProgress(0)
      const downloadUrl = await uploadAvatar(profile.uid, file, (progress) => setUploadProgress(progress))
      await updateUserProfileDocument(profile.uid, { photoURL: downloadUrl })
      await updateProfile(authUser, { photoURL: downloadUrl })
      setFeedback({ type: 'success', message: 'Foto atualizada com sucesso!' })
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', message: 'Não foi possível enviar a foto. Tente novamente.' })
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <motion.h1
            className="text-3xl font-semibold text-foreground md:text-4xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Seu perfil
          </motion.h1>
          <p className="text-sm text-muted">
            Atualize sua foto, dados pessoais e acompanhe o status do seu acesso.
          </p>
        </div>
        <motion.div
          className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-muted"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ShieldCheck className="h-4 w-4 text-primary-200" /> {statusLabel}
        </motion.div>
      </header>

      {feedback ? (
        <div
          className={`rounded-3xl border border-border/50 bg-card/70 px-4 py-3 text-sm ${
            feedback.type === 'error' ? 'text-danger-500' : 'text-success-500'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="flex flex-col items-center gap-6 text-center">
          <div className="relative">
            <Avatar src={profile.photoURL ?? null} alt={profile.name} size="lg" className="h-28 w-28" />
            <button
              type="button"
              onClick={handleAvatarClick}
              className="absolute bottom-1 right-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            {uploading ? (
              <div className="mt-3 text-xs text-muted">Enviando foto {(uploadProgress * 100).toFixed(0)}%</div>
            ) : null}
          </div>
          <div>
            <p className="text-xl font-semibold text-foreground">{profile.name}</p>
            <p className="text-sm text-muted">{profile.email}</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </Card>

        <Card className="space-y-6">
          <form className="space-y-4" onSubmit={handleSaveProfile}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Nome completo"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
              />
              <Input label="Email" value={profile.email} disabled />
            </div>
            <TextArea
              label="Bio"
              hint="Conte um pouco sobre você para o time."
              value={bio}
              onChange={(event) => setBio(event.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button type="submit" loading={saving}>
                <Check className="h-4 w-4" />
                Salvar alterações
              </Button>
            </div>
          </form>

          <div className="rounded-2xl border border-border/40 bg-card p-4 text-sm text-muted dark:border-border/60 dark:bg-card/70">
            <p className="font-semibold text-foreground">Status do acesso</p>
            <p className="mt-2">
              {profile.isActive
                ? 'Parabéns! Seu acesso está ativo. Continue colaborando com as listas em tempo real.'
                : 'Seu acesso está aguardando aprovação. Assim que um responsável autorizar você receberá liberação automática.'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
