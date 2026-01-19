import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Käyttäjää ei ole tunnistettu.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { offerId, counterPrice, counterReason, counterMessage } = body

    // Validate inputs
    if (!offerId || !counterPrice || !counterReason || !counterMessage) {
      return NextResponse.json(
        { success: false, message: 'Kaikki kentät ovat pakollisia.' },
        { status: 400 }
      )
    }

    if (typeof counterPrice !== 'number' || counterPrice <= 0) {
      return NextResponse.json(
        { success: false, message: 'Anna kelvollinen hinta.' },
        { status: 400 }
      )
    }

    // Verify that the user owns the task associated with this offer
    const { data: offer, error: offerError } = await supabase
      .from('task_offers')
      .select(`
        id,
        task_id,
        tasker_id,
        offered_price,
        status,
        task:tasks!inner(id, user_id, title)
      `)
      .eq('id', offerId)
      .single()

    if (offerError || !offer) {
      return NextResponse.json(
        { success: false, message: 'Tarjousta ei löytynyt.' },
        { status: 404 }
      )
    }

    // Check if user owns the task
    if (offer.task.user_id !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Et voi tehdä vastaehdotusta tehtävään, joka ei ole sinun.' },
        { status: 403 }
      )
    }

    // Check if offer is still pending
    if (offer.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Voit tehdä vastaehdotuksen vain odottaviin tarjouksiin.' },
        { status: 400 }
      )
    }

    // Call the database function to create counter offer
    const { data: result, error: functionError } = await supabase
      .rpc('create_counter_offer', {
        original_offer_id_param: offerId,
        new_price: counterPrice,
        counter_reason: counterReason,
        counter_message: counterMessage
      })

    if (functionError) {
      console.error('Error creating counter offer:', functionError)
      return NextResponse.json(
        { success: false, message: `Vastaehdotuksen luominen epäonnistui: ${functionError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Vastaehdotus lähetetty onnistuneesti!',
      counterOfferId: result
    })

  } catch (error) {
    console.error('Counter offer API error:', error)
    return NextResponse.json(
      { success: false, message: 'Sisäinen palvelinvirhe.' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Käyttäjää ei ole tunnistettu.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { counterOfferId, responseStatus, newCounterPrice, responseMessage } = body

    // Validate inputs
    if (!counterOfferId || !responseStatus) {
      return NextResponse.json(
        { success: false, message: 'Vastaehdotus ID ja vastaustyyppi ovat pakollisia.' },
        { status: 400 }
      )
    }

    if (responseStatus !== 'accepted' && responseStatus !== 'declined' && !newCounterPrice) {
      return NextResponse.json(
        { success: false, message: 'Anna kelvollinen vastaustyyppi tai uusi vastaehdotus.' },
        { status: 400 }
      )
    }

    // Verify that the user is the tasker for this counter offer
    const { data: counterOffer, error: counterOfferError } = await supabase
      .from('task_offers')
      .select(`
        id,
        task_id,
        tasker_id,
        offered_price,
        status,
        is_counter_offer,
        task:tasks!inner(id, user_id, title)
      `)
      .eq('id', counterOfferId)
      .eq('is_counter_offer', true)
      .single()

    if (counterOfferError || !counterOffer) {
      return NextResponse.json(
        { success: false, message: 'Vastaehdotusta ei löytynyt.' },
        { status: 404 }
      )
    }

    // Check if user is the tasker for this offer
    if (counterOffer.tasker_id !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Et voi vastata vastaehdotukseen, joka ei koske sinua.' },
        { status: 403 }
      )
    }

    // Check if counter offer is awaiting response
    if (counterOffer.status !== 'awaiting_counter_response') {
      return NextResponse.json(
        { success: false, message: 'Vastaehdotus ei odota vastausta.' },
        { status: 400 }
      )
    }

    // Call the database function to respond to counter offer
    const { data: result, error: functionError } = await supabase
      .rpc('respond_to_counter_offer', {
        counter_offer_id_param: counterOfferId,
        response_status: responseStatus,
        new_counter_price: newCounterPrice || null,
        response_message: responseMessage || null
      })

    if (functionError) {
      console.error('Error responding to counter offer:', functionError)
      return NextResponse.json(
        { success: false, message: `Vastaehdotukseen vastaaminen epäonnistui: ${functionError.message}` },
        { status: 500 }
      )
    }

    let message = 'Vastaus lähetetty onnistuneesti!'
    if (responseStatus === 'accepted') {
      message = 'Vastaehdotus hyväksytty!'
    } else if (responseStatus === 'declined') {
      message = 'Vastaehdotus hylätty.'
    } else if (newCounterPrice) {
      message = 'Uusi vastaehdotus lähetetty!'
    }

    return NextResponse.json({
      success: true,
      message,
      resultId: result
    })

  } catch (error) {
    console.error('Counter offer response API error:', error)
    return NextResponse.json(
      { success: false, message: 'Sisäinen palvelinvirhe.' },
      { status: 500 }
    )
  }
} 