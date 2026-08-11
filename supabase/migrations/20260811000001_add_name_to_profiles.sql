-- Adiciona coluna name na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;

-- Atualiza trigger para copiar full_name do auth.users para profiles.name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, created_at)
  VALUES (
    NEW.id,
    NULLIF(NEW.email, ''),
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name);
  RETURN NEW;
END;
$$;

-- Backfill dos nomes dos usuarios existentes
UPDATE public.profiles SET name = 'Ivson' WHERE email = 'faturamento@institutotravessia.org.br';
UPDATE public.profiles SET name = 'Joicy' WHERE email = 'comercial@institutotravessia.org.br';
UPDATE public.profiles SET name = 'João Pedro' WHERE email = 'compras@institutotravessia.org.br';
