# db/seeds.rb
require 'open-uri'

Product.destroy_all

10.times do |i|
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
    tags: [ Faker::Commerce.department, "Promo", "New" ].sample(2)
  )

  # Scarichiamo un'immagine casuale (200x300 px)
  # Usiamo un seed casuale nell'URL per avere immagini diverse
  image_url = "https://picsum.photos/300/300"
  downloaded_image = URI.open(image_url)

  # Alleghiamo l'immagine con ActiveStorage
  product.thumbnail.attach(
    io: downloaded_image,
    filename: "product_#{i}.jpg",
    content_type: 'image/jpeg'
  )

  if product.save
    puts "Creato: #{product.title}"
  else
    puts "Errore: #{product.errors.full_messages.join(', ')}"
  end
end

puts "Creati #{Product.count} prodotti."