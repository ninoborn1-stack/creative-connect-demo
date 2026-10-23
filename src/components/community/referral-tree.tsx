import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";

export type TreeNode = {
  id: string;
  name: string;
  slug?: string | null;
  avatarSeed?: string | null;
  headline?: string | null;
  active: boolean;
  children: TreeNode[];
};

function NodeRow({ node, root }: { node: TreeNode; root?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 py-1.5">
      <UserAvatar name={node.name} seed={node.avatarSeed} className={cn(root ? "size-10 ring-2 ring-primary" : "size-8")} />
      <div className="min-w-0">
        <p className="truncate text-sm">
          {node.slug && !root ? <Link href={`/mitglieder/${node.slug}`} className="font-medium hover:underline">{node.name}</Link> : <span className="font-medium">{node.name}</span>}
          {root && <span className="text-muted-foreground"> (du)</span>}
          {!root && !node.active && <span className="ml-1.5 text-xs text-muted-foreground">· noch nicht aktiv</span>}
        </p>
        {node.headline && <p className="truncate text-xs text-muted-foreground">{node.headline}</p>}
      </div>
      {node.children.length > 0 && !root && (
        <span className="ml-auto shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">+{node.children.length}</span>
      )}
    </div>
  );
}

function Branch({ nodes }: { nodes: TreeNode[] }) {
  return (
    <ul className="ml-4 border-l pl-4">
      {nodes.map((n) => (
        <li key={n.id} className="relative before:absolute before:top-[22px] before:-left-4 before:h-px before:w-3 before:bg-border">
          <NodeRow node={n} />
          {n.children.length > 0 && <Branch nodes={n.children} />}
        </li>
      ))}
    </ul>
  );
}

// Empfehlungsbaum: wer wurde von wem eingeladen (über User.invitedById), ab dem aktuellen User.
export function ReferralTree({ root }: { root: TreeNode }) {
  return (
    <div className="max-w-full overflow-x-auto">
      <NodeRow node={root} root />
      {root.children.length > 0 && <Branch nodes={root.children} />}
    </div>
  );
}
