
import { Button } from "@/components/ui/button";

interface StoreItemProps {
  id: string;
  name: string;
  description: string;
  price: number;
  preview?: string;
  canAfford: boolean;
  onPurchase: () => void;
}

export function StoreItem({
  id,
  name,
  description,
  price,
  preview,
  canAfford,
  onPurchase
}: StoreItemProps) {
  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="text-right">
          <div className="font-bold text-primary">{price.toLocaleString()} CT</div>
        </div>
      </div>
      
      {preview && id.includes('username') && (
        <div className="mt-3 p-2 rounded bg-muted/80">
          <span className="font-semibold" style={{ color: preview }}>
            Username Preview
          </span>
          {id === 'glowing-username' && (
            <span className="ml-2 text-xs">(Glow effect not shown in preview)</span>
          )}
        </div>
      )}
      
      <div className="mt-4">
        <Button 
          className="w-full"
          onClick={onPurchase}
          disabled={!canAfford}
        >
          {!canAfford ? "Not Enough Tokens" : "Purchase"}
        </Button>
      </div>
    </div>
  );
}
