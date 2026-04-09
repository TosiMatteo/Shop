# db/seeds.rb
require 'open-uri'

puts "Inizio Pulizia Totale..."

# 1. Cancella i record dal DB (Prodotti e Tag)
ProductTag.destroy_all
OrderItem.destroy_all
Order.destroy_all
Product.delete_all
Tag.delete_all

# 2. Cancella gli utenti (Customer e Admin)
Customer.destroy_all
Admin.destroy_all

# 3. Cancella anche i record interni di Active Storage (blobs e attachments)
ActiveStorage::Attachment.delete_all
ActiveStorage::VariantRecord.delete_all
ActiveStorage::Blob.delete_all

# 4. Cancella i file fisici dalla cartella storage
storage_dir = Rails.root.join('storage')
if Dir.exist?(storage_dir)
  FileUtils.rm_rf(Dir.glob(storage_dir.join('*')))
  puts "File fisici rimossi."
end

puts "Database pulito."


puts "\n=== Creazione Admin ==="
admin = Admin.create!(
  email: 'admin@example.com',
  password: 'AdminPassword123!',
  password_confirmation: 'AdminPassword123!'
)
puts "✓ Admin creato: #{admin.email}"
puts "  Sign in count: #{admin.sign_in_count}"


puts "\n=== Creazione Customers ==="

# Customer 1 - Già confermato
customer1 = Customer.create!(
  email: 'mario.rossi@example.com',
  password: 'Password123!',
  password_confirmation: 'Password123!',
  first_name: 'Mario',
  last_name: 'Rossi',
  confirmed_at: Time.current
)
puts "✓ Customer creato: #{customer1.email}"
puts "  Confermato: #{customer1.confirmed?}"
puts "  Nome completo: #{customer1.first_name} #{customer1.last_name}"

# Customer 2 - Già confermato
customer2 = Customer.create!(
  email: 'giulia.bianchi@example.com',
  password: 'Password123!',
  password_confirmation: 'Password123!',
  first_name: 'Giulia',
  last_name: 'Bianchi',
  confirmed_at: Time.current
)
puts "✓ Customer creato: #{customer2.email}"
puts "  Confermato: #{customer2.confirmed?}"

# Customer 3 - Non confermato (per testare conferma email)
customer3 = Customer.create!(
  email: 'test.unconfirmed@example.com',
  password: 'Password123!',
  password_confirmation: 'Password123!',
  first_name: 'Test',
  last_name: 'Unconfirmed'
)
puts "✓ Customer creato (NON confermato): #{customer3.email}"
puts "  Confermato: #{customer3.confirmed?}"
puts "  Token conferma: #{customer3.confirmation_token}"


puts "\n=== Creazione Prodotti e Tags ==="

Faker::Config.locale = "it"

tag_names = ["Elettronica", "Casa", "Abbigliamento", "Libri", "Sport", "Nuovi Arrivi"]
created_tags = tag_names.map { |name| Tag.create!(name: name) }

created_products = []

30.times do |i|
  # Generiamo dati casuali
  title = Faker::Commerce.product_name
  description = Faker::Lorem.paragraph(sentence_count: 5)
  original_price = Faker::Commerce.price(range: 50..200.0)
  is_sale = [ true, false ].sample
  price = is_sale ? (original_price * 0.8).round(2) : original_price

  product = Product.new(
    title: title,
    description: description,
    original_price: original_price,
    price: price,
    sale: is_sale
  )

  product.tags << created_tags.sample(rand(1..3))

  # Scarichiamo un'immagine casuale (200x300 px)
  begin
    image_url = "https://picsum.photos/300/300"
    downloaded_image = URI.open(image_url)
    product.thumbnail.attach(
      io: downloaded_image,
      filename: "product_#{i}.jpg",
      content_type: 'image/jpeg'
    )
  rescue OpenURI::HTTPError => e
    puts "⚠ Impossibile scaricare immagine per prodotto #{i}: #{e.message}"
  end

  if product.save
    created_products << product
    puts "Creato: #{product.title}"
  else
    puts "Errore: #{product.errors.full_messages.join(', ')}"
  end
end

puts "\n✅ Creati #{Product.count} prodotti."


puts "\n=== Creazione Ordini ==="

MARIO_ADDRESSES = [
  { shipping_name: "Mario Rossi", shipping_street: "Via Roma 1",      shipping_city: "Milano",  shipping_zip: "20100" },
  { shipping_name: "Mario Rossi", shipping_street: "Via Garibaldi 7", shipping_city: "Torino",  shipping_zip: "10100" },
  { shipping_name: "Mario Rossi", shipping_street: "Piazza Duomo 3",  shipping_city: "Firenze", shipping_zip: "50100" }
]

GIULIA_ADDRESSES = [
  { shipping_name: "Giulia Bianchi", shipping_street: "Corso Italia 42", shipping_city: "Roma",   shipping_zip: "00100" },
  { shipping_name: "Giulia Bianchi", shipping_street: "Viale Venezia 3", shipping_city: "Napoli", shipping_zip: "80100" },
  { shipping_name: "Giulia Bianchi", shipping_street: "Via Manzoni 10",  shipping_city: "Milano", shipping_zip: "20121" }
]

STATUSES = Order.statuses.keys # ["processing", "completed", "cancelled"]

# Genera N ordini per un dato customer, con date e totali diversificati
def create_orders_for(customer, products, addresses:, count:)
  count.times do |i|
    address = addresses.sample
    status  = STATUSES.sample
    # Date scalate nel passato per poter testare ordinamento dateAsc/dateDesc
    created_at = (count - i).weeks.ago

    order = Order.create!(
      customer: customer,
      status: status,
      created_at: created_at,
      **address
    )

    # Aggiungi 1-3 prodotti casuali all'ordine
    items = products.sample(rand(1..3))
    total = 0

    items.each do |product|
      quantity = rand(1..4)
      unit_price = product.price

      OrderItem.create!(
        order: order,
        product: product,
        quantity: quantity,
        unit_price: unit_price
      )

      total += unit_price * quantity
    end

    order.update_column(:total, total.round(2))

    puts "  Ordine ##{order.id} | #{customer.email} | #{status} | total: #{order.total} | #{order.created_at.to_date}"
  end
end

create_orders_for(customer1, created_products, addresses: MARIO_ADDRESSES, count: 6)
create_orders_for(customer2, created_products, addresses: GIULIA_ADDRESSES, count: 5)

puts "\n✅ Creati #{Order.count} ordini con #{OrderItem.count} order items."


puts "\n=== CREDENZIALI PER TEST ==="
puts "\nAdmin:"
puts "  Email: admin@example.com"
puts "  Password: AdminPassword123!"
puts "\nCustomer (confermato):"
puts "  Email: mario.rossi@example.com"
puts "  Password: Password123!"
puts "\nCustomer (NON confermato):"
puts "  Email: test.unconfirmed@example.com"
puts "  Password: Password123!"
puts "  Conferma token: #{customer3.confirmation_token}"
puts "\n=== NOTE ==="