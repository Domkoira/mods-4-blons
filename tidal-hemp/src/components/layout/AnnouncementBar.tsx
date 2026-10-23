import { site } from "@/config/site";

export function AnnouncementBar() {
  return (
    <div className="bg-ink text-ivory/85">
      <p className="container-x flex h-9 items-center justify-center text-center text-[10px] font-medium uppercase tracking-[0.26em]">
        {site.announcement}
      </p>
    </div>
  );
}
