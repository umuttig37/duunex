import { test, expect, Page } from '@playwright/test';
import path from 'path';
import { createClient } from '../../src/lib/supabase/client';

test.describe('Tasker Signup Form', () => {
  const uniqueEmail = `e2e_tasker_${Date.now()}@example.com`;
  const testRegion = 'test-region';
  const testCategoryQueryParam = 'test-category'; // For the page query parameter
  const profilePicturePath = path.join(__dirname, 'fixtures', 'test-avatar.png');

  // Helper function to click "Next"
  const clickNext = async (page: Page) => {
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  };

  test.beforeAll(() => {
    // Reminder to create the fixture file.
    console.log(
      `\nINFO: Ensure the test avatar file exists at: ${profilePicturePath}\n` +
      `It should be a small valid image (e.g., a 1x1 png).\n` +
      `You can create this file manually in c:\\Users\\Omistaja\\Desktop\\dev\\taskmvp\\tests\\e2e\\fixtures\\test-avatar.png\n`
    );
  });

  test('Successful Tasker Signup and Data Verification', async ({ page }) => {
    // Listen for the dialog and accept it, also capture its message
    let dialogMessage = '';
    page.on('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    await page.goto(`/signup/tasker?region=${testRegion}&category=${testCategoryQueryParam}`);
    await expect(page.getByRole('heading', { name: 'Ryhdy Tekijäksi' })).toBeVisible();

    // Step 1: Contact Information (Yhteystiedot)
    await expect(page.getByText(/Step 1 of 7: Yhteystiedot/)).toBeVisible();
    await page.getByLabel('First Name *').fill('E2ETaskerFirst');
    await page.getByLabel('Last Name *').fill('E2ETaskerLast');
    await page.getByLabel('Email Address *').fill(uniqueEmail);
    await page.getByLabel('Phone Number *').fill('0401234567');
    await page.getByLabel('Password *').fill('PasswordE2E123!');
    await clickNext(page);

    // Step 2: Location (Sijainti)
    await expect(page.getByText(/Step 2 of 7: Sijainti/)).toBeVisible();
    await page.getByLabel('Street Address *').fill('123 Test Lane');
    await page.getByLabel('City *').fill('TestingCity');
    await page.getByLabel('Zip Code *').fill('99999');
    await clickNext(page);

    // Step 3: Pricing (Hinnoittelu)
    await expect(page.getByText(/Step 3 of 7: Hinnoittelu/)).toBeVisible();
    await page.getByLabel('Your Hourly Rate (€) *').fill('30');
    await clickNext(page);

    // Step 4: Categories (Kategoriat)
    await expect(page.getByText(/Step 4 of 7: Kategoriat/)).toBeVisible();
    // Click the first available category and get its id
    const firstCategorySelector = page.locator('.grid.grid-cols-1.gap-3 > div').first();
    await expect(firstCategorySelector).toBeVisible({ timeout: 15000 });
    // Get the category name (visible text) for later DB check
    const selectedCategoryName = await firstCategorySelector.locator('span.flex-grow').textContent();
    await firstCategorySelector.click();
    await clickNext(page);

    // Step 5: Profile Picture (Profiilikuva)
    await expect(page.getByText(/Step 5 of 7: Profiilikuva/)).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles(profilePicturePath);
    await expect(page.locator('img[alt="Profile preview"]')).toHaveAttribute('src', /blob:/, { timeout: 5000 });
    await clickNext(page);

    // Step 6: Bio
    await expect(page.getByText(/Step 6 of 7: Bio/)).toBeVisible();
    await page.getByLabel('About You *').fill('This is an E2E test tasker bio. I am very reliable.');
    await clickNext(page);

    // Step 7: Availability (Saatavuus)
    await expect(page.getByText(/Step 7 of 7: Saatavuus/)).toBeVisible();
    await page.getByLabel('Your Availability (Optional)').fill('Available on weekends and weekday evenings for E2E testing.');
    await Promise.all([
      page.waitForURL('/signup/tasker/application-pending', { timeout: 10000 }),
      page.getByRole('button', { name: 'Submit Application' }).click(),
    ]);

    // Assertions
    await expect(page).toHaveURL('/signup/tasker/application-pending', { timeout: 10000 });
    expect(dialogMessage).toBe('Application submitted! Your account will be reviewed by an admin. You will be logged out.');
    await expect(page.getByRole('heading', { name: 'Application Received!' })).toBeVisible();
    await expect(page.getByText('Your application is now pending review by our team. This process typically takes 1-2 business days.')).toBeVisible();

    // Database Verification
    const supabase = createClient();
    // Find the profile by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', uniqueEmail)
      .single();
    expect(profileError).toBeNull();
    expect(profile).toBeTruthy();
    if (!profile) throw new Error('Profile not found in DB');

    // Check that at least one tasker_categories record exists for this profile
    const { data: taskerCategories, error: catError } = await supabase
      .from('tasker_categories')
      .select('category_id')
      .eq('profile_id', profile.id);
    expect(catError).toBeNull();
    expect(taskerCategories).toBeTruthy();
    expect(taskerCategories && taskerCategories.length).toBeGreaterThan(0);

    // Optionally, check the selected category name matches the DB (join with categories table)
    if (selectedCategoryName && taskerCategories) {
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name_fi')
        .in('id', taskerCategories.map((row) => row.category_id));
      const found = categories?.some((cat) => cat.name_fi === selectedCategoryName.trim());
      expect(found).toBe(true);
    }

    // Manual verification logs
    console.log(`\n--- E2E Test Data for Manual Verification (email: ${uniqueEmail}) ---\n`);
    console.log('1. Check auth.users table for the new user.');
    console.log('2. Check public.profiles table for the corresponding profile.');
    console.log('3. Check public.tasker_applications table for the new application (status: pending).');
    console.log('4. Check public.tasker_categories for the selected category.');
    console.log('5. Check Supabase Storage \'avatars\' bucket for the uploaded profile picture.');
    console.log('--- End E2E Test Data ---\n');
  });
});
