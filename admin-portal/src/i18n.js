import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: {
          app_name: "GREEN",
          tagline: "Universal Mobility Grid",
          login_identity: "Identity Matrix",
          login_logistics: "Logistics Core",
          login_ops: "Ops Command",
          login_neural: "Neural Control",
          sidebar_home: "Global Command",
          sidebar_payouts: "Payout Matrix",
          sidebar_guardian: "Guardian AI",
          sidebar_reputation: "Reputation Hub",
          rate_driver: "Rate Driver",
          rate_passenger: "Identify Personality",
          vibe_check: "Vibe ID",
          done: "Done",
          board_vehicle: "Board Vehicle"
        }
      },
      de: {
        translation: {
          app_name: "GREEN",
          tagline: "Universelles Mobilitätsnetz",
          login_identity: "Identitätsmatrix",
          login_logistics: "Logistik-Kern",
          login_ops: "Einsatzleitung",
          login_neural: "Neurale Steuerung",
          sidebar_home: "Globales Kommando",
          sidebar_payouts: "Auszahlungsmatrix",
          sidebar_guardian: "Wächter-KI",
          sidebar_reputation: "Reputationszentrum",
          rate_driver: "Fahrer bewerten",
          rate_passenger: "Persönlichkeit identifizieren",
          vibe_check: "Vibe-ID",
          done: "Fertig",
          board_vehicle: "Einsteigen"
        }
      },
      fr: {
        translation: {
          app_name: "GREEN",
          tagline: "Grille de Mobilité Universelle",
          login_identity: "Matrice d'Identité",
          login_logistics: "Noyau Logistique",
          login_ops: "Commandement Ops",
          login_neural: "Contrôle Neural",
          sidebar_home: "Commande Globale",
          sidebar_payouts: "Matrice de Paiement",
          sidebar_guardian: "IA Gardienne",
          sidebar_reputation: "Centre de Réputation",
          rate_driver: "Évaluer le Chauffeur",
          rate_passenger: "Identifier la Personnalité",
          vibe_check: "ID Vibe",
          done: "Terminé",
          board_vehicle: "Monter à Bord"
        }
      },
      es: {
        translation: {
          app_name: "GREEN",
          tagline: "Red de Movilidad Universal",
          login_identity: "Matriz de Identidad",
          login_logistics: "Núcleo Logístico",
          login_ops: "Mando de Operaciones",
          login_neural: "Control Neural",
          sidebar_home: "Mando Global",
          sidebar_payouts: "Matriz de Pagos",
          sidebar_guardian: "IA Guardiana",
          sidebar_reputation: "Centro de Reputación",
          rate_driver: "Calificar Conductor",
          rate_passenger: "Identificar Personalidad",
          vibe_check: "ID de Vibe",
          done: "Hecho",
          board_vehicle: "Subir al Vehículo"
        }
      }
    }
  });

export default i18n;
