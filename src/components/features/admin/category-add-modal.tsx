'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import { Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

type Category = Database['public']['Tables']['categories']['Row'];

interface CategoryAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onCategoryAdded: () => void;
}

export default function CategoryAddModal({
  isOpen,
  onClose,
  categories,
  onCategoryAdded,
}: CategoryAddModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name_fi: '',
    name_en: '',
    description: '',
    slug: '',
    parent_category_id: null as string | null,
    icon: '',
  });

  // Auto-generate slug from Finnish name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[åäö]/g, (match) => {
        const replacements: { [key: string]: string } = {
          å: 'a',
          ä: 'a',
          ö: 'o',
        };
        return replacements[match];
      })
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameFiChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      name_fi: value,
      slug:
        prev.slug === '' || prev.slug === generateSlug(prev.name_fi)
          ? generateSlug(value)
          : prev.slug,
    }));
  };

  const handleSave = async () => {
    if (!formData.name_fi.trim()) {
      toast.error('Suomenkielinen nimi on pakollinen');
      return;
    }

    if (!formData.slug.trim()) {
      toast.error('Slug on pakollinen');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // Check if slug already exists
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', formData.slug)
        .single();

      if (existingCategory) {
        toast.error('Slug on jo käytössä. Valitse toinen slug.');
        setIsLoading(false);
        return;
      }

      // Create new category
      const { error } = await supabase.from('categories').insert({
        name_fi: formData.name_fi.trim(),
        name_en: formData.name_en.trim() || null,
        name: formData.name_en.trim() || formData.name_fi.trim(), // Fallback to Finnish name
        description: formData.description.trim() || null,
        slug: formData.slug.trim(),
        parent_category_id: formData.parent_category_id,
        icon: formData.icon.trim() || null,
      });

      if (error) {
        console.error('Error creating category:', error);
        toast.error('Virhe kategorian luomisessa');
        return;
      }

      toast.success('Kategoria luotu onnistuneesti');

      // Reset form
      setFormData({
        name_fi: '',
        name_en: '',
        description: '',
        slug: '',
        parent_category_id: null,
        icon: '',
      });

      onCategoryAdded();
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Odottamaton virhe');
    } finally {
      setIsLoading(false);
    }
  };

  const mainCategories = categories.filter((cat) => !cat.parent_category_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lisää uusi kategoria</DialogTitle>
          <DialogDescription>
            Luo uusi kategoriapalveluille. Voit luoda pääkategorian tai
            alakategorian.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Category Names */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name_fi">Nimi (Suomi) *</Label>
              <Input
                id="name_fi"
                value={formData.name_fi}
                onChange={(e) => handleNameFiChange(e.target.value)}
                placeholder="esim. Siivous"
                required
              />
            </div>
            <div>
              <Label htmlFor="name_en">Nimi (Englanti)</Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name_en: e.target.value }))
                }
                placeholder="e.g. Cleaning"
              />
            </div>
          </div>

          {/* Slug */}
          <div>
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, slug: e.target.value }))
              }
              placeholder="siivous"
              className="font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground mt-1">
              URL-ystävällinen tunniste. Luodaan automaattisesti
              suomenkielisestä nimestä.
            </p>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Kuvaus</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Kategorian kuvaus..."
              rows={3}
            />
          </div>

          {/* Parent Category */}
          <div>
            <Label htmlFor="parent_category">Yläkategoria</Label>
            <Select
              value={formData.parent_category_id || 'none'}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  parent_category_id: value === 'none' ? null : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Valitse yläkategoria (valinnainen)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  Ei yläkategoriaa (pääkategoria)
                </SelectItem>
                {mainCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name_fi || category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Icon */}
          <div>
            <Label htmlFor="icon">Ikoni</Label>
            <Input
              id="icon"
              value={formData.icon}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, icon: e.target.value }))
              }
              placeholder="esim. cleaning, tools, car"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Ikonin nimi (valinnainen). Käytetään UI:ssa kategorian
              tunnistamiseen.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Peruuta
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Luodaan...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Luo kategoria
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
