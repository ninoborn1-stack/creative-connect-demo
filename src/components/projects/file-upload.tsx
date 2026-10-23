"use client";

import { useRef, useTransition } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadProjectFile } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FileUpload({ projectId }: { projectId: string }) {
  const [pending, start] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={form}
      className="flex flex-col gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-end"
      action={(fd) =>
        start(async () => {
          const res = await uploadProjectFile(projectId, fd);
          if (res.ok) {
            toast.success(res.message ?? "Hochgeladen.");
            form.current?.reset();
          } else toast.error(res.error);
        })
      }
    >
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="file-input">Datei hochladen (Demo, max. 900 KB)</Label>
        <Input id="file-input" name="file" type="file" required />
      </div>
      <Button type="submit" disabled={pending}>
        <Upload aria-hidden /> {pending ? "Lädt hoch …" : "Hochladen"}
      </Button>
    </form>
  );
}
