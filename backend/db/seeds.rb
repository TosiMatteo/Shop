# db/seeds.rb
require 'open-uri'

ProductTag.destroy_all
Product.destroy_all
Tag.destroy_all

Faker::Config.locale = "it"

tag_names = ["Elettronica", "Casa", "Abbigliamento", "Libri", "Sport", "Nuovi Arrivi"]
created_tags = tag_names.map { |name| Tag.create!(name: name) }

20.times do |i|
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