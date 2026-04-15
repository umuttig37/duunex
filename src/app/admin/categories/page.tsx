'use client';

import CategoryAddModal from '@/components/features/admin/category-add-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import { Edit, Plus, Tag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type Category = Database['public']['Tables']['categories']['Row'];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesWithTaskCount, setCategoriesWithTaskCount] = useState<
    (Category & { taskCount: number })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const supabase = createClient();

      // Fetch all categories
      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        setError('Virhe kategorioiden haussa');
        return;
      }

      setCategories(categories || []);

      // Get task count per category
      const categoriesWithTaskCount = await Promise.all(
        (categories || []).map(async (category) => {
          const { count } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);

          return {
            ...category,
            taskCount: count || 0,
          };
        })
      );

      setCategoriesWithTaskCount(categoriesWithTaskCount);
    } catch (err) {
      console.error('Error:', err);
      setError('Odottamaton virhe');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categoriesWithTaskCount.filter(
    (category) =>
      searchTerm === '' ||
      category.name_fi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Ladataan kategorioita...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  const categoryStats = {
    total: filteredCategories?.length || 0,
    withDescriptions:
      filteredCategories?.filter((c) => c.description).length || 0,
    withParent:
      filteredCategories?.filter((c) => c.parent_category_id).length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Category Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Kategoriat Yhteensä
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Kuvauksen kanssa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-600">
              {categoryStats.withDescriptions}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alakategoriat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {categoryStats.withParent}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Kategorioiden Hallinta
            </CardTitle>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Lisää Kategoria
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <Input
              placeholder="Hae kategorioita..."
              className="max-w-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredCategories.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {searchTerm
                ? 'Ei kategorioita löytynyt hakuehdoilla.'
                : 'Ei kategorioita löytynyt.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nimi (FI)</TableHead>
                  <TableHead>Nimi (EN)</TableHead>
                  <TableHead>Kuvaus</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Tehtävien Määrä</TableHead>
                  <TableHead className="text-right">Toiminnot</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="font-medium">{category.name_fi}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {category.name_en || category.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {category.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {category.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {category.taskCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="mr-1 h-3 w-3" />
                          Muokkaa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Poista
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Category Add Modal */}
      <CategoryAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        categories={categories}
        onCategoryAdded={fetchCategories}
      />
    </div>
  );
}
