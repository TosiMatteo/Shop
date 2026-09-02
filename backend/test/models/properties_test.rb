require "test_helper"

# Property-based testing.
#
# I test di esempio verificano una post-condizione su un input scelto a mano;
# qui la stessa post-condizione viene verificata su input generati
# automaticamente da Rantly. Le proprietà sono le formule universalmente
# quantificate di docs/SPECIFICA.md (§ 7.2).
#
# NOTA: non si carica "rantly/minitest_extensions" perché quel file fa
# `require "minitest/unit"`, rimosso a partire da Minitest 6, e romperebbe
# l'intera suite. L'estensione si limita a definire un metodo `property_of`
# che istanzia Rantly::Property, quindi si carica direttamente la classe e si
# definisce il metodo qui sotto: nessuna patch alla gemma, nessun vincolo di
# versione su Minitest.
ENV["RANTLY_VERBOSE"] ||= "0" # sopprime i puntini di avanzamento nell'output
require "rantly"
require "rantly/property"

class PropertiesTest < ActiveSupport::TestCase
  SHIPPING = { name: "Mario Rossi", street: "Via Roma 1", city: "Bologna", zip: "40121" }.freeze

  # Sostituisce rantly/minitest_extensions.
  def property_of(&block)
    Rantly::Property.new(block)
  end

  # Prezzi generati in centesimi e riportati a due decimali: la colonna è
  # numeric(10,2), quindi generare float arbitrari confonderebbe un errore di
  # arrotondamento con un errore di logica.
  def product_with_price(cents, label)
    price = BigDecimal(cents.to_s) / 100
    Product.create!(
      title: "PBT-#{label}",
      description: "prodotto generato per il property based testing",
      price: price,
      original_price: price,
      sale: false
    )
  end

  def cart_from(rows)
    cart = Cart.create!(customer: customers(:Customer_Auth))
    expected = BigDecimal("0")

    rows.each_with_index do |(quantity, cents), index|
      product = product_with_price(cents, "#{index}-#{cents}")
      cart.cart_items.create!(product: product, quantity: quantity)
      expected += quantity * product.price
    end

    [ cart, expected ]
  end

  # ─── PBT-1 — OP-1 ──────────────────────────────────────────────────────────
  # ∀ carrello: total_price = Σ qty(i) × price(prod(i))
  test "total_price equals the sum of quantity times price for any cart" do
    property_of {
      Array.new(range(1, 4)) { [ range(1, 5), range(1, 200_000) ] }
    }.check(15) do |rows|
      cart, expected = cart_from(rows)

      assert_equal expected, cart.total_price
    end
  end

  # ─── PBT-2 — OP-2 ──────────────────────────────────────────────────────────
  # ∀ carrello non vuoto, il checkout produce un ordine il cui totale e le cui
  # righe riproducono il carrello, e distrugge il carrello.
  test "checkout preserves the total and every line of any non empty cart" do
    property_of {
      Array.new(range(1, 4)) { [ range(1, 5), range(1, 200_000) ] }
    }.check(10) do |rows|
      cart, expected = cart_from(rows)
      snapshot = cart.cart_items.map { |i| [ i.product_id, i.quantity, i.product.price ] }.sort

      order = cart.checkout(SHIPPING)

      assert_equal expected, order.total
      assert_equal rows.size, order.order_items.count
      assert_equal snapshot, order.order_items.map { |l| [ l.product_id, l.quantity, l.unit_price ] }.sort
      assert_equal "processing", order.status
      assert_not Cart.exists?(cart.id), "il carrello deve essere distrutto dal checkout"
    end
  end

  # ─── PBT-3 — OP-4a ─────────────────────────────────────────────────────────
  # Il filtro su intervallo deve essere corretto (nessun risultato fuori
  # intervallo) e completo (nessun ordine in intervallo lasciato fuori): si
  # confronta la query SQL con un oracolo calcolato in Ruby.
  test "search_by_min_max_total agrees with the ruby oracle on any range" do
    customer = customers(:Customer_Auth)
    [ 0, 15, 99, 100, 101, 250, 500 ].each_with_index do |total, index|
      Order.create!(
        customer: customer, total: total,
        shipping_name: "N#{index}", shipping_street: "S", shipping_city: "C", shipping_zip: "40121"
      )
    end
    all = customer.orders.to_a

    property_of { [ range(0, 500), range(0, 500) ] }.check(30) do |(a, b)|
      min, max = [ a, b ].minmax

      expected = all.select { |o| o.total >= min && o.total <= max }.map(&:id).sort
      actual = customer.orders.search_by_min_max_total(min, max).pluck(:id).sort

      assert_equal expected, actual
    end
  end

  # ─── PBT-4 — OP-3 / INV-C1 ─────────────────────────────────────────────────
  # ∀ sequenza di aggiunte dello stesso prodotto: resta una sola riga e la
  # quantità è la somma delle quantità aggiunte.
  test "adding the same product repeatedly keeps a single line with the summed quantity" do
    property_of {
      Array.new(range(1, 5)) { range(1, 9) }
    }.check(15) do |quantities|
      cart = Cart.create!(customer: customers(:Customer_Auth))
      product = product_with_price(1_000, "merge-#{quantities.join('-')}")

      quantities.each do |quantity|
        existing = cart.cart_items.find_by(product_id: product.id)
        if existing
          existing.update!(quantity: existing.quantity + quantity)
        else
          cart.cart_items.create!(product: product, quantity: quantity)
        end
      end

      assert_equal 1, cart.cart_items.reload.size
      assert_equal quantities.sum, cart.cart_items.first.quantity
    end
  end
end
