import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, GripVertical, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PhotoReviewModalProps {
  open: boolean;
  photos: string[];
  onConfirm: (updatedPhotos: string[]) => void;
  onCancel: () => void;
}

interface SortablePhotoItemProps {
  id: string;
  photo: string;
  index: number;
  onDelete: (index: number) => void;
}

function SortablePhotoItem({ id, photo, index, onDelete }: SortablePhotoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-md transition-shadow"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Photo Thumbnail */}
      <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0 border">
        <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
      </div>

      {/* Photo Info */}
      <div className="flex-1">
        <p className="font-medium text-sm">Photo {index + 1}</p>
        <p className="text-xs text-gray-500">Drag to reorder</p>
      </div>

      {/* Delete Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onDelete(index)}
        className="text-red-500 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function PhotoReviewModal({
  open,
  photos,
  onConfirm,
  onCancel,
}: PhotoReviewModalProps) {
  const [localPhotos, setLocalPhotos] = useState<string[]>(photos);

  // Update local photos when props change
  useEffect(() => {
    setLocalPhotos(photos);
  }, [photos]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalPhotos((items) => {
        const oldIndex = items.findIndex((_, i) => `photo-${i}` === active.id);
        const newIndex = items.findIndex((_, i) => `photo-${i}` === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDelete = (index: number) => {
    setLocalPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (localPhotos.length === 0) {
      alert("You must keep at least one photo!");
      return;
    }
    onConfirm(localPhotos);
  };

  const handleCancel = () => {
    // Reset to original photos
    setLocalPhotos(photos);
    onCancel();
  };

  const deletedCount = photos.length - localPhotos.length;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">
            📸 Review Your Photos ({localPhotos.length})
          </DialogTitle>
          <DialogDescription>
            Delete unwanted photos or drag to reorder them before AI processing
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Photo List */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localPhotos.map((_, i) => `photo-${i}`)}
              strategy={verticalListSortingStrategy}
            >
              {localPhotos.map((photo, index) => (
                <SortablePhotoItem
                  key={`photo-${index}`}
                  id={`photo-${index}`}
                  photo={photo}
                  index={index}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Status Message */}
        {deletedCount > 0 && (
          <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
            ⚠️ {deletedCount} photo{deletedCount > 1 ? 's' : ''} will be removed
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={localPhotos.length === 0}
            className="flex-1"
          >
            Continue with {localPhotos.length} Photo{localPhotos.length > 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

