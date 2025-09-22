import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { db, storage } from '../../config/firebase'

export async function uploadAvatar(
  uid: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const extension = file.name.split('.').pop() ?? 'jpg'
  const storageRef = ref(storage, `avatars/${uid}/${Date.now()}.${extension}`)
  const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type })

  return await new Promise<string>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = snapshot.bytesTransferred / snapshot.totalBytes
        onProgress?.(progress)
      },
      (error) => {
        reject(error)
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
        resolve(downloadUrl)
      },
    )
  })
}

export async function updateUserProfileDocument(uid: string, data: Record<string, unknown>) {
  const userDoc = doc(db, 'users', uid)
  await updateDoc(userDoc, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}
