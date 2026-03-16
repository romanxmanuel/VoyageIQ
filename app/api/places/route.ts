import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const input = searchParams.get('input')

  if (!input || input.length < 2) {
    return NextResponse.json({ predictions: [] })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ predictions: [] })
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json')
  url.searchParams.set('input', input)
  url.searchParams.set('types', '(cities)')
  url.searchParams.set('key', apiKey)

  const response = await fetch(url.toString())
  const data = await response.json()

  const predictions = (data.predictions ?? []).map((p: any) => ({
    placeId: p.place_id,
    description: p.description,
    mainText: p.structured_formatting?.main_text ?? p.description,
    secondaryText: p.structured_formatting?.secondary_text ?? '',
  }))

  return NextResponse.json({ predictions })
}
