-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.announcement_replies (
  id integer NOT NULL DEFAULT nextval('announcement_replies_id_seq'::regclass),
  announcement_id integer,
  reply_content text NOT NULL,
  created_by uuid,
  is_public boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT announcement_replies_pkey PRIMARY KEY (id),
  CONSTRAINT announcement_replies_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.team_members(id),
  CONSTRAINT announcement_replies_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.announcements(id)
);
CREATE TABLE public.announcements (
  id integer NOT NULL DEFAULT nextval('announcements_id_seq'::regclass),
  title text NOT NULL,
  content text NOT NULL,
  type text DEFAULT 'general'::text CHECK (type = ANY (ARRAY['general'::text, 'urgent'::text, 'maintenance'::text, 'feature'::text])),
  target_audience text DEFAULT 'all'::text CHECK (target_audience = ANY (ARRAY['all'::text, 'business_admin'::text, 'floor_manager'::text, 'sales_associate'::text])),
  is_pinned boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_by uuid,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT announcements_pkey PRIMARY KEY (id),
  CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.team_members(id)
);
CREATE TABLE public.appointments (
  id integer NOT NULL DEFAULT nextval('appointments_id_seq'::regclass),
  customer_id integer,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  appointment_date timestamp with time zone NOT NULL,
  duration_minutes integer DEFAULT 60,
  floor integer NOT NULL CHECK (floor = ANY (ARRAY[1, 2, 3])),
  assigned_to uuid,
  status text DEFAULT 'scheduled'::text CHECK (status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT appointments_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.team_members(id)
);
CREATE TABLE public.audit_logs (
  id integer NOT NULL DEFAULT nextval('audit_logs_id_seq'::regclass),
  table_name text NOT NULL,
  record_id integer NOT NULL,
  action text NOT NULL CHECK (action = ANY (ARRAY['create'::text, 'update'::text, 'delete'::text, 'restore'::text])),
  old_values jsonb,
  new_values jsonb,
  user_id uuid,
  user_email text,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.team_members(id)
);
CREATE TABLE public.business_settings (
  id bigint NOT NULL DEFAULT 1,
  name text,
  email text,
  phone text,
  address text,
  website text,
  description text,
  business_hours jsonb DEFAULT '{}'::jsonb,
  tax_rate numeric DEFAULT 0.00,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT business_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.categories (
  id integer NOT NULL DEFAULT nextval('categories_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  description text,
  image_url text,
  parent_id integer,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id)
);
CREATE TABLE public.customers (
  id integer NOT NULL DEFAULT nextval('customers_id_seq'::regclass),
  name text NOT NULL,
  phone text NOT NULL,
  interest text NOT NULL,
  floor integer NOT NULL CHECK (floor = ANY (ARRAY[1, 2, 3])),
  visited_date date NOT NULL,
  assigned_to uuid,
  notes text,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'lead'::text, 'prospect'::text, 'customer'::text, 'vip'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  preferred_metal text,
  preferred_style text,
  preferred_occasion text,
  budget text,
  first_name text,
  last_name text,
  email text,
  address text,
  city text,
  state text,
  country text DEFAULT 'India'::text,
  date_of_birth date,
  anniversary_date date,
  catchment_area text,
  community text,
  mother_tongue text,
  reason_for_visit text,
  lead_source text,
  age_of_end_user text,
  saving_scheme text,
  next_follow_up date,
  summary_notes text,
  deleted_at timestamp with time zone,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.team_members(id)
);
CREATE TABLE public.deals (
  id integer NOT NULL DEFAULT nextval('deals_id_seq'::regclass),
  title text NOT NULL,
  customer_id integer,
  customer_name text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0::numeric),
  stage text NOT NULL CHECK (stage = ANY (ARRAY['lead'::text, 'contacted'::text, 'qualified'::text, 'proposal'::text, 'negotiation'::text, 'closed_won'::text, 'closed_lost'::text])),
  probability integer CHECK (probability >= 0 AND probability <= 100),
  expected_close_date date,
  assigned_to uuid,
  floor integer CHECK (floor = ANY (ARRAY[1, 2, 3])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT deals_pkey PRIMARY KEY (id),
  CONSTRAINT deals_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.team_members(id),
  CONSTRAINT deals_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);
CREATE TABLE public.escalations (
  id integer NOT NULL DEFAULT nextval('escalations_id_seq'::regclass),
  title text NOT NULL,
  description text NOT NULL,
  customer_id integer,
  customer_name text,
  priority text DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])),
  status text DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text])),
  assigned_to uuid,
  created_by uuid,
  floor integer CHECK (floor = ANY (ARRAY[1, 2, 3])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT escalations_pkey PRIMARY KEY (id),
  CONSTRAINT escalations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.team_members(id),
  CONSTRAINT escalations_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.team_members(id),
  CONSTRAINT escalations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);
CREATE TABLE public.kb_articles (
  id integer NOT NULL DEFAULT nextval('kb_articles_id_seq'::regclass),
  title text NOT NULL,
  content text NOT NULL,
  category text,
  tags ARRAY,
  is_published boolean DEFAULT false,
  view_count integer DEFAULT 0,
  author_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT kb_articles_pkey PRIMARY KEY (id),
  CONSTRAINT kb_articles_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.team_members(id)
);
CREATE TABLE public.order_items (
  id integer NOT NULL DEFAULT nextval('order_items_id_seq'::regclass),
  order_id integer,
  product_id integer,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0::numeric),
  total_price numeric NOT NULL CHECK (total_price >= 0::numeric),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.orders (
  id integer NOT NULL DEFAULT nextval('orders_id_seq'::regclass),
  customer_id integer,
  customer_name text NOT NULL,
  total_amount numeric NOT NULL CHECK (total_amount >= 0::numeric),
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'processing'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text])),
  floor integer CHECK (floor = ANY (ARRAY[1, 2, 3])),
  created_by uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.team_members(id)
);
CREATE TABLE public.products (
  id integer NOT NULL DEFAULT nextval('products_id_seq'::regclass),
  name text NOT NULL,
  sku text NOT NULL UNIQUE,
  type text NOT NULL,
  category text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0::numeric),
  image text,
  description text,
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  image_url text,
  main_image_url text,
  additional_images_urls ARRAY,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sales (
  id integer NOT NULL DEFAULT nextval('sales_id_seq'::regclass),
  customer_id integer,
  customer_name text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0::numeric),
  date date NOT NULL,
  floor integer NOT NULL CHECK (floor = ANY (ARRAY[1, 2, 3])),
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sales_pkey PRIMARY KEY (id),
  CONSTRAINT sales_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT sales_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.team_members(id)
);
CREATE TABLE public.stores (
  id integer NOT NULL DEFAULT nextval('stores_id_seq'::regclass),
  name text NOT NULL,
  address text,
  city text,
  state text,
  phone text,
  email text,
  manager_id uuid,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'maintenance'::text])),
  opening_hours jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT stores_pkey PRIMARY KEY (id),
  CONSTRAINT stores_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.team_members(id)
);
CREATE TABLE public.support_ticket_messages (
  id integer NOT NULL DEFAULT nextval('support_ticket_messages_id_seq'::regclass),
  ticket_id integer NOT NULL,
  sender_id uuid,
  message text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT support_ticket_messages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.support_tickets (
  id integer NOT NULL DEFAULT nextval('support_tickets_id_seq'::regclass),
  title text NOT NULL,
  description text NOT NULL,
  customer_id integer,
  priority text DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])),
  status text DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text])),
  assigned_to uuid,
  created_by uuid,
  floor integer CHECK (floor = ANY (ARRAY[1, 2, 3])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.team_members(id),
  CONSTRAINT support_tickets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.team_members(id),
  CONSTRAINT support_tickets_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);
CREATE TABLE public.team_members (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['business_admin'::text, 'floor_manager'::text, 'sales_associate'::text, 'support_staff'::text])),
  floor integer CHECK (floor = ANY (ARRAY[1, 2, 3])),
  phone text,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'on_leave'::text])),
  avatar text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT team_members_pkey PRIMARY KEY (id)
);
CREATE TABLE public.team_messages (
  id integer NOT NULL DEFAULT nextval('team_messages_id_seq'::regclass),
  subject text NOT NULL,
  content text NOT NULL,
  sender_id uuid,
  recipient_id uuid,
  is_read boolean DEFAULT false,
  message_type text DEFAULT 'direct'::text CHECK (message_type = ANY (ARRAY['direct'::text, 'group'::text, 'announcement'::text])),
  priority text DEFAULT 'normal'::text CHECK (priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT team_messages_pkey PRIMARY KEY (id),
  CONSTRAINT team_messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.team_members(id),
  CONSTRAINT team_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.team_members(id)
);
CREATE TABLE public.tenants (
  id integer NOT NULL DEFAULT nextval('tenants_id_seq'::regclass),
  name text NOT NULL,
  subdomain text UNIQUE,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text, 'trial'::text, 'cancelled'::text])),
  plan text DEFAULT 'basic'::text CHECK (plan = ANY (ARRAY['basic'::text, 'premium'::text, 'enterprise'::text])),
  max_users integer DEFAULT 10,
  settings jsonb DEFAULT '{}'::jsonb,
  billing_email text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tenants_pkey PRIMARY KEY (id)
);
CREATE TABLE public.visits (
  id integer NOT NULL DEFAULT nextval('visits_id_seq'::regclass),
  customer_id integer,
  customer_name text NOT NULL,
  floor integer NOT NULL CHECK (floor = ANY (ARRAY[1, 2, 3])),
  date date NOT NULL,
  interest text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT visits_pkey PRIMARY KEY (id),
  CONSTRAINT visits_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);