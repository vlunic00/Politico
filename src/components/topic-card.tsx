import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Factory,
  FlaskConical,
  Globe,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  Leaf,
  Map,
  Scale,
  Shield,
  ShoppingBasket,
  TrainFront,
  Users,
} from "lucide-react";
import { topics, indicators } from "@/lib/catalogue";

const icons = {
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Factory,
  FlaskConical,
  Globe,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  Leaf,
  Map,
  Scale,
  Shield,
  ShoppingBasket,
  TrainFront,
  Users,
};

export function TopicCard({ topic }: { topic: (typeof topics)[number] }) {
  const Icon = icons[topic.icon];
  const count = indicators.filter(
    (indicator) => indicator.topic === topic.slug,
  ).length;
  return (
    <Link
      href={`/topics/${topic.slug}`}
      className="surface group flex h-full flex-col p-5 transition-colors hover:border-primary/40"
    >
      <div className="mb-5 flex items-center justify-between">
        <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
          <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
        </span>
        <ArrowUpRight
          size={16}
          aria-hidden="true"
          className="text-muted-foreground group-hover:text-primary"
        />
      </div>
      <h3 className="font-semibold tracking-tight">{topic.name}</h3>
      <p className="subtle mt-1 flex-1 text-xs">{topic.description}</p>
      <p className="mt-5 border-t pt-3 text-[11px] text-muted-foreground">
        {count} planirana pokazatelja · čeka provjeru
      </p>
    </Link>
  );
}
