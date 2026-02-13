# Health Assistant Chatbot – Architecture (Phase Mock Front)

## Modules identifiés
- **Frontend principal :** `apps/web/src/features/home/components/home.tsx` (route d’accueil authentifiée).
- **Expérience cible :** un chatbot multi-profils affiché côté web uniquement, branché pour l’instant sur un service mock.

## Architecture actuelle (sans backend)

### Frontend (`apps/web`)
1. `src/features/health-assistant/constants.ts`  
   - Liste des 5 profils, accents UI, tags rapides et disclaimer par défaut.
2. `src/features/health-assistant/api.ts`  
   - Service mock `sendHealthAssistantMessage` qui route le message avec des mots-clés locaux et renvoie une réponse simulée (contenu + suggestions + disclaimer) après un léger délai.
3. `src/features/health-assistant/components/HealthAssistantPage.tsx`  
   - Page dédiée avec header multi-cartes (avatars importés depuis `src/assets`), formulaire compact pour les données perso, historique par expert et zone de chat en thème sombre.
4. `src/features/health-assistant/components/HealthChatbot.tsx`  
   - Composant réutilisable : historique, sélecteur manuel/auto, tags rapides, textarea responsive, affichage des requêtes mockées.
5. `src/features/health-assistant/routes/index.tsx` & `src/routes/health-assistant.tsx`  
   - Route protégée + page accessible via la sidebar (`/health-assistant`).

### Backend
- Non implémenté pour cette phase : l’endpoint `/api/chat/health-assistant` sera ajouté plus tard (Fastify/tRPC).  
- La logique de routing/suggestions est encapsulée côté front pour faciliter la migration vers un vrai service IA.

Cette approche permet de démontrer l’UI/UX complète du chatbot et de valider le comportement multi-profils sans dépendre d’un backend encore indéfini. Lorsque l’API sera prête, il suffira de remplacer le service mock par l’appel réseau réel.
