import 'dotenv/config'

import {
  createClient,
} from '@supabase/supabase-js'

async function run(): Promise<void> {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (
    !supabaseUrl ||
    !supabaseAnonKey
  ) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }

  const supabase =
    createClient(
      supabaseUrl,
      supabaseAnonKey
    )

  console.log('')
  console.log(
    '========================================'
  )
  console.log(
    '   ARCANA APP → CATALOG CHECK'
  )
  console.log(
    '========================================'
  )
  console.log('')

  const {
    data,
    error,
  } =
    await supabase
      .from('arcana_catalog')
      .select(
        'barcode, name, brand, category'
      )
      .limit(5)

  if (error) {
    console.error(
      '❌ Arcana App NO pudo leer arcana_catalog.'
    )

    console.error(
      error.message
    )

    process.exitCode = 1
    return
  }

  console.log(
    `Productos leídos: ${data?.length ?? 0}`
  )

  console.log('')

  for (
    const product
    of data ?? []
  ) {
    console.log(
      `${product.barcode} | ${product.name}`
    )
  }

  console.log('')
  console.log(
    'ARCANA APP PUEDE LEER arcana_catalog ✅'
  )
  console.log('')
}

void run()