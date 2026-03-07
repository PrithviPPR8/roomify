import puter from "@heyputer/puter.js";

export const signIn = async () => await puter.auth.signIn();

export const signOut = () => puter.auth.signOut();

export const getCurrentUser = async () => {
    if (!puter.auth.isSignedIn()) {
         return null;
     }
    return await puter.auth.getUser();
}
