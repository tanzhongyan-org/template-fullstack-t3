import { Badge } from "~/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/shared/components/ui/card";

export interface ExampleItem {
  id: number;
  title: string;
  body: string;
}

/** Presentational list with ready and empty states; stories cover each state. */
export function ExampleList({ items }: { items: ExampleItem[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No examples yet. Create the first one below.
        </CardContent>
      </Card>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <Badge variant="secondary">#{item.id}</Badge>
            </CardHeader>
            {item.body ? (
              <CardContent className="text-sm text-muted-foreground">{item.body}</CardContent>
            ) : null}
          </Card>
        </li>
      ))}
    </ul>
  );
}
