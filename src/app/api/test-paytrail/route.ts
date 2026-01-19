import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test 1: Check environment variables
    const envCheck = {
      merchantId: !!process.env.PAYTRAIL_MERCHANT_ID,
      secretKey: !!process.env.PAYTRAIL_SECRET_KEY,
      baseUrl: !!process.env.NEXT_PUBLIC_BASE_URL,
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
    
    // Test 2: Check database - payments table exists
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id')
      .limit(1)
    
    const dbCheck = {
      paymentsTableExists: !paymentsError,
      paymentsError: paymentsError?.message || null,
    }
    
    // Test 3: Check if we can create a test payment record
    let testPaymentCheck = { canCreatePayment: false, error: null as string | null }
    
    if (!paymentsError) {
      const testPaymentId = `test-${Date.now()}`
      const { error: insertError } = await supabase
        .from('payments')
        .insert({
          id: testPaymentId,
          task_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          amount: 0.01,
          status: 'test',
        })
      
      if (!insertError) {
        // Clean up test record
        await supabase
          .from('payments')
          .delete()
          .eq('id', testPaymentId)
        
        testPaymentCheck.canCreatePayment = true
      } else {
        testPaymentCheck.error = insertError.message
      }
    }
    
    // Test 4: Check Paytrail configuration
    const paytrailConfig = {
      testMerchantId: process.env.PAYTRAIL_MERCHANT_ID === '375917',
      testSecretKey: process.env.PAYTRAIL_SECRET_KEY === 'SAIPPUAKAUPPIAS',
      isTestEnvironment: true,
    }
    
    // Summary
    const allChecksPass = 
      Object.values(envCheck).every(v => v === true) &&
      dbCheck.paymentsTableExists &&
      testPaymentCheck.canCreatePayment
    
    return NextResponse.json({
      success: allChecksPass,
      timestamp: new Date().toISOString(),
      checks: {
        environment: envCheck,
        database: dbCheck,
        testPayment: testPaymentCheck,
        paytrail: paytrailConfig,
      },
      summary: {
        ready: allChecksPass,
        message: allChecksPass 
          ? 'Paytrail-integraatio on valmis käytettäväksi!' 
          : 'Joitakin tarkistuksia epäonnistui. Tarkista yllä olevat virheet.',
      }
    })
    
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
} 