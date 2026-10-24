import Image from "next/image";
import { UserRound } from "lucide-react";
import { portraits } from "@/lib/politics";

export function LeaderPortrait({
  portrait,
  preload = false,
}: {
  portrait?: keyof typeof portraits;
  preload?: boolean;
}) {
  if (!portrait)
    return (
      <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 bg-accent/60 text-primary">
        <UserRound size={48} strokeWidth={1} aria-hidden="true" />
        <p className="text-[10px] text-muted-foreground">
          Fotografija nije dostupna
        </p>
      </div>
    );
  const image = portraits[portrait];
  return (
    <Image
      src={image.src}
      alt={image.name}
      fill
      sizes={
        preload
          ? "(max-width: 768px) 100vw, 50vw"
          : "(max-width: 640px) 75vw, 300px"
      }
      preload={preload}
      className="object-cover object-[center_22%]"
    />
  );
}
