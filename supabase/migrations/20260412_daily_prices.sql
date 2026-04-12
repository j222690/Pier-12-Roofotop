-- Insere o setting daily_prices se ainda não existir
-- Este setting armazena preços de entrada específicos por dia da semana
-- Formato: { "0": null, "1": null, ..., "6": null }
-- null = usa o preço padrão global (setting "prices")
-- objeto = { "male": 50, "female": 30 } = preço específico para aquele dia

INSERT INTO public.business_settings (setting_key, setting_value)
VALUES (
  'daily_prices',
  '{"0": null, "1": null, "2": null, "3": null, "4": null, "5": null, "6": null}'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;
