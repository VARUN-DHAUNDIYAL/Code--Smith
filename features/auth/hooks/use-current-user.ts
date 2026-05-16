import { useUser } from "@clerk/nextjs";

export const useCurrentUser = () => {
    const { user } = useUser();
    
    if (!user) return null;

    return {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? "",
        name: user.fullName ?? "",
        image: user.imageUrl ?? ""
    };
};