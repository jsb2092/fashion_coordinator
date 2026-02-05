import { AddSupplyForm } from "@/components/shoe-care/AddSupplyForm";

export default function AddSupplyPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New Supply</h1>
        <p className="text-muted-foreground">
          Add a shoe care supply to your inventory
        </p>
      </div>
      <AddSupplyForm />
    </div>
  );
}
