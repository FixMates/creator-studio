import {httpsCallable} from "firebase/functions";
import {auth, functions} from "@/lib/firebase/client";

/** Changes the current creator's publication status through trusted validation. */
export async function setStorePublication(published: boolean) {
  if (!functions || !auth?.currentUser) throw new Error("Sign in to manage your store.");
  const call = httpsCallable<{published: boolean}, {published: boolean; url: string | null}>(
    functions,
    "setStorePublication",
  );
  const result = await call({published});
  return result.data;
}
