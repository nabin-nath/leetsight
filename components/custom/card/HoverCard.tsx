import { CalendarIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface HoverCardCustomProps {
  title: string;
  full_name: string;
  picture_url: string;
}

export function HoverCardCustom({
  title,
  full_name,
  picture_url,
}: HoverCardCustomProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link" className="p-1">{title}</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-fit">
        <div className="flex justify-between items-center gap-4">
          <Avatar>
            <AvatarImage src={picture_url} />
            <AvatarFallback>
              {full_name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <h4 className="text-xs">{title}</h4>
            <h4 className="text-sm font-semibold">{full_name}</h4>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
