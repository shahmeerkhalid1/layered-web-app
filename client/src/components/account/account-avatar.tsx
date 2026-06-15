"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, avatarDisplayUrl, getDisplayInitials } from "@/lib/utils";
import { useSignedAvatarUrl } from "@/hooks/use-signed-avatar-url";

interface AccountAvatarProps {
  name: string;
  image?: string | null;
  /** Bumps when the image file changes so browser cache does not show a stale photo. */
  imageVersion?: number;
  size?: "default" | "sm" | "lg";
  className?: string;
  fallbackClassName?: string;
}

export function AccountAvatar({
  name,
  image,
  imageVersion,
  size = "default",
  className,
  fallbackClassName,
}: AccountAvatarProps) {
  const initials = getDisplayInitials(name);
  const resolvedImage = useSignedAvatarUrl(image);
  const src = avatarDisplayUrl(resolvedImage, imageVersion);
  const useCustomDimensions =
    className !== undefined && /\bsize-/.test(className);
  // Remount when photo is removed so Base UI resets imageLoadingStatus and shows fallback.
  const avatarKey = src ?? "initials";

  return (
    <Avatar
      key={avatarKey}
      size={useCustomDimensions ? "default" : size}
      className={className}
    >
      {src ? (
        <AvatarImage key={src} src={src} alt="" />
      ) : null}
      <AvatarFallback
        className={cn(
          "bg-secondary text-xs font-semibold text-secondary-foreground",
          fallbackClassName
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
