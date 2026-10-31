import Link from "next/link";
import { PageHead } from "@/components/chrome/PageHead";

export default function NotFound() {
  return (
    <PageHead label="404" title="Not here">
      <p>
        Nothing lives at this address. If a link on this site sent you here, that&apos;s my bug —{" "}
        <Link href="/" className="link">
          start from the top
        </Link>
        .
      </p>
    </PageHead>
  );
}
