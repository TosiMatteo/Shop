# db/seeds.rb
require 'open-uri'

puts "Inizio Pulizia Totale..."

# 1. Cancella i record dal DB (Prodotti e Tag)
ProductTag.destroy_all
Product.delete_all
Tag.delete_all

# 2. Cancella gli utenti (Customer e Admin)
Customer.destroy_all
Admin.destroy_all

# 3. Cancella anche i record interni di Active Storage (blobs e attachments)
ActiveStorage::Attachment.delete_all
ActiveStorage::VariantRecord.delete_all
ActiveStorage::Blob.delete_all

# 4. CRUCIALE: Cancella i file fisici dalla cartella storage
# Attenzione: cancella tutto il contenuto di /storage tranne .keep
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
  confirmed_at: Time.current # Conferma subito l'account
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
# Non setto confirmed_at
)
puts "✓ Customer creato (NON confermato): #{customer3.email}"
puts "  Confermato: #{customer3.confirmed?}"
puts "  Token conferma: #{customer3.confirmation_token}"


puts "\n=== Creazione Prodotti e Tags ==="

Faker::Config.locale = "it"

tag_names = ["Elettronica", "Casa", "Abbigliamento", "Libri", "Sport", "Nuovi Arrivi"]
created_tags = tag_names.map { |name| Tag.create!(name: name) }

30.times do |i|
  # Generiamo dati casuali
  title = Faker::Commerce.product_name
  description = Faker::Lorem.paragraph(sentence_count: 5)
  original_price = Faker::Commerce.price(range: 50..200.0)

  # Decidiamo a caso se è in sconto
  is_sale = [ true, false ].sample
  price = is_sale ? (original_price * 0.8).round(2) : original_price

  # Creiamo l'oggetto
  product = Product.new(
    title: title,
    description: description,
    original_price: original_price,
    price: price,
    sale: is_sale,
    )

  product.tags << created_tags.sample(rand(1..3))

  # Scarichiamo un'immagine casuale (200x300 px)
  # Usiamo un rescue per evitare che il seed si blocchi se cade la connessione a picsum
  begin
    image_url = "https://picsum.photos/300/300"
    downloaded_image = URI.open(image_url)

    # Alleghiamo l'immagine con ActiveStorage
    product.thumbnail.attach(
      io: downloaded_image,
      filename: "product_#{i}.jpg",
      content_type: 'image/jpeg'
    )
  rescue OpenURI::HTTPError => e
    puts "⚠Impossibile scaricare immagine per prodotto #{i}: #{e.message}"
  end

  if product.save
    puts "Creato: #{product.title}"
  else
    puts "Errore: #{product.errors.full_messages.join(', ')}"
  end
end

puts "\n✅ Seeds completati! Creati #{Product.count} prodotti."

puts "\n=== CREDENZIALI PER TEST ==="
puts "\nAdmin:"
puts "  Email: admin@example.com"
puts "  Password: AdminPassword123!"
puts "\nCustomer (confermato):"
puts "  Email: mario.rossi@example.com"
puts "  Password: Password123!"
puts "\nCustomer (NON confermato - per testare conferma):"
puts "  Email: test.unconfirmed@example.com"
puts "  Password: Password123!"
puts "  Conferma token: #{customer3.confirmation_token}"
puts "\n=== NOTE ==="
puts "- Gli account già confermati possono fare login subito"
puts "- L'account non confermato richiede conferma email prima del login"
puts "- Per testare password reset, usa l'endpoint POST /api/customers/password"