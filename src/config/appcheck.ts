import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import { app } from './firebase'

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''

let appCheckInitialized = false

export function initializeAppCheckIfEnabled() {
    if (appCheckInitialized) {
        console.log('App Check já inicializado')
        return
    }

    if (!RECAPTCHA_SITE_KEY) {
        console.warn('App Check não configurado: VITE_RECAPTCHA_SITE_KEY não definida')
        return
    }

    try {
        initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
            isTokenAutoRefreshEnabled: true,
        })
        appCheckInitialized = true
        console.log('App Check inicializado com sucesso')
    } catch (error) {
        console.error('Erro ao inicializar App Check:', error)
    }
}


