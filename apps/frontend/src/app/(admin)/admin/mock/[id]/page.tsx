"use client";

import { use } from "react";
import { ContentManager } from "../../sources/_components/content-manager";

export default function MockContentPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    return <ContentManager sourceId={id} type="mock" />;
}
