--
-- PostgreSQL database dump
--

\restrict PzYbY93iCO0wrBJmdoEiQk2enlM4ZWftXsx1TkEjx3qQ7Kz9T2eROBzCCTHjmgC

-- Dumped from database version 17.9 (Ubuntu 17.9-1.pgdg24.04+1)
-- Dumped by pg_dump version 17.9 (Debian 17.9-1.pgdg12+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.vendors DROP CONSTRAINT IF EXISTS vendors_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.vendor_vehicle_models DROP CONSTRAINT IF EXISTS vendor_vehicle_models_vendor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.vendor_vehicle_models DROP CONSTRAINT IF EXISTS vendor_vehicle_models_vehicle_model_id_fkey;
ALTER TABLE IF EXISTS ONLY public.vendor_subscriptions DROP CONSTRAINT IF EXISTS vendor_subscriptions_vendor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.vendor_subscriptions DROP CONSTRAINT IF EXISTS vendor_subscriptions_plan_id_fkey;
ALTER TABLE IF EXISTS ONLY public.vendor_part_subcategories DROP CONSTRAINT IF EXISTS vendor_part_subcategories_vendor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.vendor_part_subcategories DROP CONSTRAINT IF EXISTS vendor_part_subcategories_part_subcategory_id_fkey;
ALTER TABLE IF EXISTS ONLY public.vendor_metrics DROP CONSTRAINT IF EXISTS vendor_metrics_vendor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.vehicle_models DROP CONSTRAINT IF EXISTS vehicle_models_brand_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.requests DROP CONSTRAINT IF EXISTS requests_vehicle_model_id_fkey;
ALTER TABLE IF EXISTS ONLY public.requests DROP CONSTRAINT IF EXISTS requests_vehicle_brand_id_fkey;
ALTER TABLE IF EXISTS ONLY public.requests DROP CONSTRAINT IF EXISTS requests_state_id_fkey;
ALTER TABLE IF EXISTS ONLY public.requests DROP CONSTRAINT IF EXISTS requests_part_subcategory_id_fkey;
ALTER TABLE IF EXISTS ONLY public.requests DROP CONSTRAINT IF EXISTS requests_part_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.requests DROP CONSTRAINT IF EXISTS requests_municipality_id_fkey;
ALTER TABLE IF EXISTS ONLY public.requests DROP CONSTRAINT IF EXISTS requests_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.request_vendor_matches DROP CONSTRAINT IF EXISTS request_vendor_matches_vendor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.request_vendor_matches DROP CONSTRAINT IF EXISTS request_vendor_matches_request_id_fkey;
ALTER TABLE IF EXISTS ONLY public.request_responses DROP CONSTRAINT IF EXISTS request_responses_vendor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.request_responses DROP CONSTRAINT IF EXISTS request_responses_request_id_fkey;
ALTER TABLE IF EXISTS ONLY public.request_ratings DROP CONSTRAINT IF EXISTS request_ratings_vendor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.request_ratings DROP CONSTRAINT IF EXISTS request_ratings_request_id_fkey;
ALTER TABLE IF EXISTS ONLY public.request_ratings DROP CONSTRAINT IF EXISTS request_ratings_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.part_subcategories DROP CONSTRAINT IF EXISTS part_subcategories_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.municipalities DROP CONSTRAINT IF EXISTS municipalities_state_id_fkey;
ALTER TABLE IF EXISTS ONLY public.files DROP CONSTRAINT IF EXISTS files_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.email_verification_tokens DROP CONSTRAINT IF EXISTS email_verification_tokens_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chats DROP CONSTRAINT IF EXISTS chats_vendor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chats DROP CONSTRAINT IF EXISTS chats_request_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chats DROP CONSTRAINT IF EXISTS chats_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_chat_id_fkey;
DROP INDEX IF EXISTS public.vendors_user_id_key;
DROP INDEX IF EXISTS public.vendor_vehicle_models_vendor_id_vehicle_model_id_key;
DROP INDEX IF EXISTS public.vendor_part_subcategories_vendor_id_part_subcategory_id_key;
DROP INDEX IF EXISTS public.vendor_metrics_vendor_id_key;
DROP INDEX IF EXISTS public.vehicle_models_brand_id_name_key;
DROP INDEX IF EXISTS public.vehicle_brands_name_key;
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public.user_roles_user_id_role_id_key;
DROP INDEX IF EXISTS public.states_name_key;
DROP INDEX IF EXISTS public.roles_name_key;
DROP INDEX IF EXISTS public.requests_status_idx;
DROP INDEX IF EXISTS public.requests_state_id_municipality_id_idx;
DROP INDEX IF EXISTS public.requests_client_id_idx;
DROP INDEX IF EXISTS public.request_vendor_matches_vendor_id_idx;
DROP INDEX IF EXISTS public.request_vendor_matches_request_id_vendor_id_key;
DROP INDEX IF EXISTS public.request_vendor_matches_request_id_idx;
DROP INDEX IF EXISTS public.request_responses_request_id_vendor_id_key;
DROP INDEX IF EXISTS public.request_ratings_vendor_id_idx;
DROP INDEX IF EXISTS public.request_ratings_request_id_key;
DROP INDEX IF EXISTS public.password_reset_tokens_token_key;
DROP INDEX IF EXISTS public.part_subcategories_category_id_name_key;
DROP INDEX IF EXISTS public.part_categories_name_key;
DROP INDEX IF EXISTS public.municipalities_state_id_name_key;
DROP INDEX IF EXISTS public.email_verification_tokens_token_key;
DROP INDEX IF EXISTS public.chats_vendor_id_idx;
DROP INDEX IF EXISTS public.chats_request_id_vendor_id_client_id_key;
DROP INDEX IF EXISTS public.chats_client_id_idx;
DROP INDEX IF EXISTS public.chat_messages_chat_id_created_at_idx;
ALTER TABLE IF EXISTS ONLY public.vendors DROP CONSTRAINT IF EXISTS vendors_pkey;
ALTER TABLE IF EXISTS ONLY public.vendor_vehicle_models DROP CONSTRAINT IF EXISTS vendor_vehicle_models_pkey;
ALTER TABLE IF EXISTS ONLY public.vendor_subscriptions DROP CONSTRAINT IF EXISTS vendor_subscriptions_pkey;
ALTER TABLE IF EXISTS ONLY public.vendor_part_subcategories DROP CONSTRAINT IF EXISTS vendor_part_subcategories_pkey;
ALTER TABLE IF EXISTS ONLY public.vendor_metrics DROP CONSTRAINT IF EXISTS vendor_metrics_pkey;
ALTER TABLE IF EXISTS ONLY public.vehicle_models DROP CONSTRAINT IF EXISTS vehicle_models_pkey;
ALTER TABLE IF EXISTS ONLY public.vehicle_brands DROP CONSTRAINT IF EXISTS vehicle_brands_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_pkey;
ALTER TABLE IF EXISTS ONLY public.states DROP CONSTRAINT IF EXISTS states_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.requests DROP CONSTRAINT IF EXISTS requests_pkey;
ALTER TABLE IF EXISTS ONLY public.request_vendor_matches DROP CONSTRAINT IF EXISTS request_vendor_matches_pkey;
ALTER TABLE IF EXISTS ONLY public.request_responses DROP CONSTRAINT IF EXISTS request_responses_pkey;
ALTER TABLE IF EXISTS ONLY public.request_ratings DROP CONSTRAINT IF EXISTS request_ratings_pkey;
ALTER TABLE IF EXISTS ONLY public.plans DROP CONSTRAINT IF EXISTS plans_pkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.part_subcategories DROP CONSTRAINT IF EXISTS part_subcategories_pkey;
ALTER TABLE IF EXISTS ONLY public.part_categories DROP CONSTRAINT IF EXISTS part_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.municipalities DROP CONSTRAINT IF EXISTS municipalities_pkey;
ALTER TABLE IF EXISTS ONLY public.files DROP CONSTRAINT IF EXISTS files_pkey;
ALTER TABLE IF EXISTS ONLY public.email_verification_tokens DROP CONSTRAINT IF EXISTS email_verification_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.chats DROP CONSTRAINT IF EXISTS chats_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_pkey;
DROP TABLE IF EXISTS public.vendors;
DROP TABLE IF EXISTS public.vendor_vehicle_models;
DROP TABLE IF EXISTS public.vendor_subscriptions;
DROP TABLE IF EXISTS public.vendor_part_subcategories;
DROP TABLE IF EXISTS public.vendor_metrics;
DROP TABLE IF EXISTS public.vehicle_models;
DROP TABLE IF EXISTS public.vehicle_brands;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.user_roles;
DROP TABLE IF EXISTS public.states;
DROP TABLE IF EXISTS public.roles;
DROP TABLE IF EXISTS public.requests;
DROP TABLE IF EXISTS public.request_vendor_matches;
DROP TABLE IF EXISTS public.request_responses;
DROP TABLE IF EXISTS public.request_ratings;
DROP TABLE IF EXISTS public.plans;
DROP TABLE IF EXISTS public.password_reset_tokens;
DROP TABLE IF EXISTS public.part_subcategories;
DROP TABLE IF EXISTS public.part_categories;
DROP TABLE IF EXISTS public.municipalities;
DROP TABLE IF EXISTS public.files;
DROP TABLE IF EXISTS public.email_verification_tokens;
DROP TABLE IF EXISTS public.chats;
DROP TABLE IF EXISTS public.chat_messages;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid NOT NULL,
    chat_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    message_text text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: chats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chats (
    id uuid NOT NULL,
    request_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    client_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: email_verification_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_verification_tokens (
    id uuid NOT NULL,
    token text NOT NULL,
    user_id uuid NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.files (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    file_name text NOT NULL,
    cloud_storage_path text NOT NULL,
    is_public boolean DEFAULT false NOT NULL,
    content_type text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: municipalities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.municipalities (
    id uuid NOT NULL,
    state_id uuid NOT NULL,
    name text NOT NULL
);


--
-- Name: part_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.part_categories (
    id uuid NOT NULL,
    name text NOT NULL
);


--
-- Name: part_subcategories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.part_subcategories (
    id uuid NOT NULL,
    category_id uuid NOT NULL,
    name text NOT NULL
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id uuid NOT NULL,
    token text NOT NULL,
    user_id uuid NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans (
    id uuid NOT NULL,
    name text NOT NULL,
    description text,
    price double precision NOT NULL,
    billing_cycle text NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: request_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.request_ratings (
    id uuid NOT NULL,
    request_id uuid NOT NULL,
    client_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: request_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.request_responses (
    id uuid NOT NULL,
    request_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    initial_message text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: request_vendor_matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.request_vendor_matches (
    id uuid NOT NULL,
    request_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    delivered_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    responded boolean DEFAULT false NOT NULL,
    declined boolean DEFAULT false NOT NULL,
    responded_at timestamp(3) without time zone,
    declined_at timestamp(3) without time zone
);


--
-- Name: requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.requests (
    id uuid NOT NULL,
    client_id uuid NOT NULL,
    vehicle_brand_id uuid NOT NULL,
    vehicle_model_id uuid NOT NULL,
    part_category_id uuid NOT NULL,
    part_subcategory_id uuid,
    state_id uuid,
    municipality_id uuid,
    search_radius_km integer,
    free_description text NOT NULL,
    status text DEFAULT 'ABIERTA'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    closed_at timestamp(3) without time zone
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid NOT NULL,
    name text NOT NULL
);


--
-- Name: states; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.states (
    id uuid NOT NULL,
    name text NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    role_id uuid NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    document_id text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    email_verified boolean DEFAULT false NOT NULL
);


--
-- Name: vehicle_brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicle_brands (
    id uuid NOT NULL,
    name text NOT NULL
);


--
-- Name: vehicle_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicle_models (
    id uuid NOT NULL,
    brand_id uuid NOT NULL,
    name text NOT NULL
);


--
-- Name: vendor_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_metrics (
    id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    total_requests_received integer DEFAULT 0 NOT NULL,
    total_requests_answered integer DEFAULT 0 NOT NULL,
    avg_rating double precision,
    total_ratings integer DEFAULT 0 NOT NULL,
    last_activity_at timestamp(3) without time zone
);


--
-- Name: vendor_part_subcategories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_part_subcategories (
    id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    part_subcategory_id uuid NOT NULL
);


--
-- Name: vendor_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_subscriptions (
    id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone NOT NULL,
    status text NOT NULL
);


--
-- Name: vendor_vehicle_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_vehicle_models (
    id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    vehicle_model_id uuid NOT NULL
);


--
-- Name: vendors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    business_name text NOT NULL,
    rif text NOT NULL,
    logo_url text,
    document_image_url text,
    is_available boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    city text,
    country text,
    full_address text,
    latitude double precision,
    longitude double precision,
    municipality text,
    parish text,
    postal_code text,
    reference_point text,
    state text,
    street text
);


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_messages (id, chat_id, sender_id, message_text, created_at) FROM stdin;
b21b8126-d3dd-4ba3-8e45-5a8a0ca95853	c7a722a0-4bdc-4936-97ad-4657ac52acb2	892c5e81-8af4-425e-856f-d1a0e826f892	Si lo tengo Disponible	2026-04-21 17:30:35.849
5a56da62-130f-45bc-9c25-0fae81e4b2b9	c7a722a0-4bdc-4936-97ad-4657ac52acb2	c2cc95c3-1903-4f50-9175-2f551c7f6812	cuanto	2026-04-21 17:31:26.382
b2e1087c-f2f8-4b44-84f3-0a22f4bc5d1e	c7a722a0-4bdc-4936-97ad-4657ac52acb2	892c5e81-8af4-425e-856f-d1a0e826f892	100$	2026-04-21 17:31:52.344
6bf026f4-ecd8-4ec3-ad11-d4c51f657523	c7a722a0-4bdc-4936-97ad-4657ac52acb2	c2cc95c3-1903-4f50-9175-2f551c7f6812	tais pasao tumbale algo	2026-04-21 17:32:18.943
e3dacc60-1b62-4b3b-81b6-5bdd793807f6	f566d0c2-0ba2-45ed-9cda-e37ec36f7adc	604e58ec-58d4-4fc0-b367-9886d6ee2e26	Lo tengo disponible 80$	2026-04-21 19:11:25.97
a6a748d9-7f08-43f1-9619-f66ac3a0b522	f6d2ae2e-0f6e-40c1-bdef-91e970c72869	892c5e81-8af4-425e-856f-d1a0e826f892	Si lo tengo disponible	2026-04-21 19:12:08.882
2828eb81-f815-4ed6-a17e-8045227c0965	f6d2ae2e-0f6e-40c1-bdef-91e970c72869	51037da5-29dc-4684-ad0f-a460352261ec	Cuánto cuesta???	2026-04-21 19:12:48.966
d66e6a9a-db58-4f75-9785-b382cc69f001	f566d0c2-0ba2-45ed-9cda-e37ec36f7adc	892c5e81-8af4-425e-856f-d1a0e826f892	Tais pasado tengo 50$ a BCV	2026-04-21 19:13:57.87
93c8b63a-a97c-4db8-9e5c-baf4ab6cc2b6	ac7be06a-7375-4334-9662-8de516211e03	604e58ec-58d4-4fc0-b367-9886d6ee2e26	La tengo 80$	2026-04-21 19:20:20.623
b2142b03-cebd-4856-9d65-d904d0cd4793	89000a47-07e3-43f4-b8c6-6b0716ee3d83	892c5e81-8af4-425e-856f-d1a0e826f892	Si tengo Barataaaaaaa	2026-04-21 19:20:41.89
f042a47b-d687-4235-aad8-09ac6fb12100	ac7be06a-7375-4334-9662-8de516211e03	51037da5-29dc-4684-ad0f-a460352261ec	Dejamela en 30$	2026-04-21 19:22:56.167
5e4051d9-4625-4e49-8747-95b7269f6566	89000a47-07e3-43f4-b8c6-6b0716ee3d83	892c5e81-8af4-425e-856f-d1a0e826f892	Hola	2026-04-21 19:52:40.489
2cf1e719-01f0-4daa-b39f-5a124c947c77	ac7be06a-7375-4334-9662-8de516211e03	604e58ec-58d4-4fc0-b367-9886d6ee2e26	70$ lo menos	2026-04-21 19:53:40.27
b4a82cf2-f414-4f17-bb5d-1ac30e9803ba	f566d0c2-0ba2-45ed-9cda-e37ec36f7adc	604e58ec-58d4-4fc0-b367-9886d6ee2e26	75 lo menos	2026-04-21 19:54:17.31
80b48789-cd8a-47e1-be6d-d6caa298ee6c	89000a47-07e3-43f4-b8c6-6b0716ee3d83	892c5e81-8af4-425e-856f-d1a0e826f892	Pedro	2026-04-21 19:55:36.977
c29c3b14-d84c-4bb6-a0b0-bf239f72d4f8	0f31f522-0403-4ddf-80f5-559acd7ecadb	604e58ec-58d4-4fc0-b367-9886d6ee2e26	De plástico te sirve ?	2026-04-21 20:09:07.939
ba118d31-e05b-4d6a-a696-1035ef700235	0f31f522-0403-4ddf-80f5-559acd7ecadb	51037da5-29dc-4684-ad0f-a460352261ec	No me sirve	2026-04-21 20:09:32.372
a61713b3-9442-442e-9504-e48080c1e49d	ffb3dbef-29d5-4f78-b566-c2cf1a8c6eaf	892c5e81-8af4-425e-856f-d1a0e826f892	Si lo tengo	2026-04-21 20:22:37.168
66743fe4-25a4-4a2e-85a5-2d3fe5bda416	c7a722a0-4bdc-4936-97ad-4657ac52acb2	892c5e81-8af4-425e-856f-d1a0e826f892	Dame 80$	2026-04-21 21:23:26.48
8ad4959a-459c-4ad5-b058-3ed0813f0cf6	76f5f16b-bb66-47ae-bf89-2c71a6a506d6	892c5e81-8af4-425e-856f-d1a0e826f892	Si.lo tengo	2026-04-21 23:12:30.528
351d75ea-095e-49ef-bf74-97eec22c4bf0	76f5f16b-bb66-47ae-bf89-2c71a6a506d6	804b2420-2e52-4ab4-834d-5132029a20d0	Cuanto vale	2026-04-21 23:13:19.946
16518883-1c96-4a04-af23-384f4b33833b	76f5f16b-bb66-47ae-bf89-2c71a6a506d6	892c5e81-8af4-425e-856f-d1a0e826f892	200	2026-04-21 23:13:28.012
\.


--
-- Data for Name: chats; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chats (id, request_id, vendor_id, client_id, created_at) FROM stdin;
c7a722a0-4bdc-4936-97ad-4657ac52acb2	4f0e2b0f-1f5d-4a09-a787-6b69441842c2	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	c2cc95c3-1903-4f50-9175-2f551c7f6812	2026-04-21 17:30:35.847
f566d0c2-0ba2-45ed-9cda-e37ec36f7adc	dd3f35fc-82bc-4b23-949c-0530ae67d643	9b28fc49-c10e-43ca-b940-7acd2d858bbc	892c5e81-8af4-425e-856f-d1a0e826f892	2026-04-21 19:11:25.968
f6d2ae2e-0f6e-40c1-bdef-91e970c72869	3dd3a74a-4a71-4227-b6cf-58a2d6db4b27	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	51037da5-29dc-4684-ad0f-a460352261ec	2026-04-21 19:12:08.88
ac7be06a-7375-4334-9662-8de516211e03	932428c3-a0a3-4648-86ca-e08d79c86153	9b28fc49-c10e-43ca-b940-7acd2d858bbc	51037da5-29dc-4684-ad0f-a460352261ec	2026-04-21 19:20:20.621
89000a47-07e3-43f4-b8c6-6b0716ee3d83	932428c3-a0a3-4648-86ca-e08d79c86153	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	51037da5-29dc-4684-ad0f-a460352261ec	2026-04-21 19:20:41.888
0f31f522-0403-4ddf-80f5-559acd7ecadb	b8cf7a18-5b24-4850-aa35-ade12b94dd34	9b28fc49-c10e-43ca-b940-7acd2d858bbc	51037da5-29dc-4684-ad0f-a460352261ec	2026-04-21 20:09:07.937
ffb3dbef-29d5-4f78-b566-c2cf1a8c6eaf	17522d48-4b02-478c-8d73-bde6031ddcb9	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	51037da5-29dc-4684-ad0f-a460352261ec	2026-04-21 20:22:37.166
76f5f16b-bb66-47ae-bf89-2c71a6a506d6	887e2a6c-eb9f-47da-8236-3ad2155c4f6c	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	804b2420-2e52-4ab4-834d-5132029a20d0	2026-04-21 23:12:30.523
\.


--
-- Data for Name: email_verification_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_verification_tokens (id, token, user_id, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.files (id, user_id, file_name, cloud_storage_path, is_public, content_type, created_at) FROM stdin;
a977caf5-2669-4866-ac5c-621c2ce017c2	2da7b616-4b2e-44db-9704-ddff2bfe8e4d	doc_id.jpg	37513/uploads/1776791141556-doc_id.jpg	f	image/jpeg	2026-04-21 17:05:42.332
49e6c33c-23de-4730-ae4d-cc2d9eef1529	2da7b616-4b2e-44db-9704-ddff2bfe8e4d	logo.jpg	37513/public/uploads/1776791142507-logo.jpg	t	image/jpeg	2026-04-21 17:05:43.017
d0d73b96-15f0-4618-9208-5478a7d08482	892c5e81-8af4-425e-856f-d1a0e826f892	doc_id.jpg	37513/uploads/1776791810787-doc_id.jpg	f	image/jpeg	2026-04-21 17:16:52.389
1c08ee0e-3685-4d11-b757-cf95bdb18940	892c5e81-8af4-425e-856f-d1a0e826f892	logo.jpg	37513/public/uploads/1776791812596-logo.jpg	t	image/jpeg	2026-04-21 17:16:53.306
bffaed36-17f7-418f-954a-ef88cddf956d	604e58ec-58d4-4fc0-b367-9886d6ee2e26	doc_id.jpg	37513/uploads/1776793288551-doc_id.jpg	f	image/jpeg	2026-04-21 17:41:30.369
a94b5d43-e089-4849-8663-dac13868c0c4	604e58ec-58d4-4fc0-b367-9886d6ee2e26	logo.jpg	37513/public/uploads/1776793290550-logo.jpg	t	image/jpeg	2026-04-21 17:41:31.426
74c7a7f0-1c11-4ea8-ad2c-e5661c176294	51037da5-29dc-4684-ad0f-a460352261ec	doc_id.jpg	37513/uploads/1776798175977-doc_id.jpg	f	image/jpeg	2026-04-21 19:02:57.178
f99d5857-9bbd-41b9-97b5-fa3a0207168f	51037da5-29dc-4684-ad0f-a460352261ec	logo.jpg	37513/public/uploads/1776798177372-logo.jpg	t	image/jpeg	2026-04-21 19:02:57.954
18851f3e-1529-485e-8d2b-84f4edfa774c	804b2420-2e52-4ab4-834d-5132029a20d0	doc_id.jpg	37513/uploads/1776812897024-doc_id.jpg	f	image/jpeg	2026-04-21 23:08:18.41
c2bf977a-a9df-4283-8314-72ddbc8ddfb9	804b2420-2e52-4ab4-834d-5132029a20d0	logo.jpg	37513/public/uploads/1776812898651-logo.jpg	t	image/jpeg	2026-04-21 23:08:19.431
\.


--
-- Data for Name: municipalities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.municipalities (id, state_id, name) FROM stdin;
4bbca04b-f50e-4a39-bbda-b45f71b55e1c	edab9703-cc2a-4ff6-b266-017bf131bd44	Libertador
583f7eb5-81ad-457d-81f8-89ee93082019	938c178b-3023-4302-aa84-46711fbabe9a	Sucre
de19c56c-5536-46bf-8f5e-d5fac3570155	938c178b-3023-4302-aa84-46711fbabe9a	Baruta
3e3f34a1-54da-4442-ac09-17ba751698bf	938c178b-3023-4302-aa84-46711fbabe9a	Chacao
a388e19d-2ae3-4204-b4f7-649ef9a27226	938c178b-3023-4302-aa84-46711fbabe9a	El Hatillo
4b755804-4970-40d7-bef7-79928fedcd5d	938c178b-3023-4302-aa84-46711fbabe9a	Plaza
ac87c3df-903d-4f13-9e42-ae4b6df15642	9061be39-7a95-45be-9fe8-331ffc7babd7	Valencia
1e0f048f-b6e6-46f3-8435-4996e9372df7	9061be39-7a95-45be-9fe8-331ffc7babd7	Naguanagua
08a9b478-204a-489f-a5cd-bc3180447a57	9061be39-7a95-45be-9fe8-331ffc7babd7	San Diego
6d4682db-bef4-4ad4-88a7-3834f57f36c4	9061be39-7a95-45be-9fe8-331ffc7babd7	Libertador
bc46a220-bd3d-4b40-a859-47280ee9549d	92d5c8b6-601d-4e5c-ae6e-62b8eb334828	Maracaibo
0ee58ebc-faa7-4020-af74-4f1bee84040e	92d5c8b6-601d-4e5c-ae6e-62b8eb334828	San Francisco
351a3249-d259-40c0-bce7-00556efdb142	92d5c8b6-601d-4e5c-ae6e-62b8eb334828	Cabimas
52277181-0b79-4811-a232-6e32ee9ae078	92d5c8b6-601d-4e5c-ae6e-62b8eb334828	Lagunillas
77b74d3e-4f54-47d7-ac98-46fb522e0503	80345211-b5cf-40a6-bcfa-208ee132488e	Girardot
f4c16dc2-2c0e-4dbc-aa13-1fadf1dac2e7	80345211-b5cf-40a6-bcfa-208ee132488e	Santiago Mariño
1d242461-7be9-4915-8142-736a7ae42940	80345211-b5cf-40a6-bcfa-208ee132488e	Libertador
0d5eca36-4801-4e8d-9e28-52c898eb4a72	80345211-b5cf-40a6-bcfa-208ee132488e	Zamora
5a92ff85-ca75-49ae-9136-f0520b14e31a	d666ef5a-652b-410c-87b0-112ade9878ba	Iribarren
461315f7-099a-451d-9319-49602aa99b03	d666ef5a-652b-410c-87b0-112ade9878ba	Palavecino
50f8a30d-cedf-4e9d-8064-fbaa58915fd6	d666ef5a-652b-410c-87b0-112ade9878ba	Cabudare
4ce91511-4e68-4e09-bc97-b4408fae72c9	964c9732-fb01-4473-8a7c-754e2d6e414f	San Cristóbal
2cf495ad-6511-48cb-8e8e-8b9c87a532d2	964c9732-fb01-4473-8a7c-754e2d6e414f	Cárdenas
1801cb5e-c42a-461b-906f-8c815cff50f9	964c9732-fb01-4473-8a7c-754e2d6e414f	Junín
e2fce2fc-8e28-479f-bfdf-12f8288f521e	478d949d-5966-41e6-bffe-4b3478d75db7	Sotillo
6d64791c-61df-4367-a54a-2189ad63d418	478d949d-5966-41e6-bffe-4b3478d75db7	Urbaneja
f7a17c46-1e63-4963-a854-f2a93fcb559b	478d949d-5966-41e6-bffe-4b3478d75db7	Bolívar
a1e5a26e-15bc-4f11-a778-6777fc413f2e	478d949d-5966-41e6-bffe-4b3478d75db7	Simón Rodríguez
a02cefef-62a6-4d9c-9bcb-545659173bc6	2793385c-94c0-41c6-8caf-d3a2dd203778	Caroní
9a9accdb-13b4-4884-9d83-e306ab7c2a05	2793385c-94c0-41c6-8caf-d3a2dd203778	Heres
1fc0595d-aca0-4bc7-b175-95a90c3656cc	2793385c-94c0-41c6-8caf-d3a2dd203778	Piar
b88b1e8a-6bad-4f19-be70-58be4bb05fd1	5d78aaec-9650-4e44-bb38-de406bba0351	Libertador
dddde511-082d-4aee-81bd-df90326b85ac	5d78aaec-9650-4e44-bb38-de406bba0351	Campo Elías
1ee0eba3-0522-46b7-b5a6-1a6dee948150	5d78aaec-9650-4e44-bb38-de406bba0351	Sucre
\.


--
-- Data for Name: part_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.part_categories (id, name) FROM stdin;
72f7e625-7d64-4e7f-b30f-3f86b9d50922	Motor
d13414db-4b70-4ef9-8315-c1c6c47e608c	Transmisión
3a18186f-2e6a-467b-88c2-bc3e89045225	Suspensión
25bccf8f-95f2-4510-84f1-f2ba7eefd95f	Frenos
9622cfdb-f8ce-4a83-919a-3ba79d06727f	Eléctrico
0480c124-33be-476c-9f22-b69f85530443	Carrocería
402b98c6-3ad0-46cc-a1fa-6c4b3d7bd642	Iluminación
37155995-3398-44c6-aba0-42b367941304	Interior
11d1adc6-1405-41cf-8a59-6d5b423af98b	Neumáticos
89229bd4-0478-48b4-8668-a33d9d0949a9	Filtros
\.


--
-- Data for Name: part_subcategories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.part_subcategories (id, category_id, name) FROM stdin;
2e6c839d-0138-4463-b40c-8715b555af82	72f7e625-7d64-4e7f-b30f-3f86b9d50922	Pistones
822d5352-c062-4bb5-a7b2-1698808521fc	72f7e625-7d64-4e7f-b30f-3f86b9d50922	Bielas
2dd01ce2-06f1-4e8d-8e9c-702b130c45cc	72f7e625-7d64-4e7f-b30f-3f86b9d50922	Cigüeñal
ee98488e-66de-4358-8039-49d460320183	72f7e625-7d64-4e7f-b30f-3f86b9d50922	Válvulas
ef810363-a515-4554-8ffe-aa01e8e01a14	72f7e625-7d64-4e7f-b30f-3f86b9d50922	Bujías
d89a1445-8cc6-445c-b62c-99e23da32dad	72f7e625-7d64-4e7f-b30f-3f86b9d50922	Empaques
cd33bac7-d5cf-4624-8084-d9315dbb8125	d13414db-4b70-4ef9-8315-c1c6c47e608c	Caja de cambios
4f19eb0f-ec57-4c39-a5bf-9145b4d6d31c	d13414db-4b70-4ef9-8315-c1c6c47e608c	Embrague
fc8f5791-6042-41ad-9bd8-3bca1610f48c	d13414db-4b70-4ef9-8315-c1c6c47e608c	Cardán
3c5bef21-55dd-4499-85ca-ed81da008a0f	d13414db-4b70-4ef9-8315-c1c6c47e608c	Diferencial
aced3581-ee8d-49f0-b36f-bba03a9aa51c	3a18186f-2e6a-467b-88c2-bc3e89045225	Amortiguadores
6d6095e9-a519-4a9b-920b-21ff1f3622d2	3a18186f-2e6a-467b-88c2-bc3e89045225	Resortes
cf8ea1c5-7088-46c4-bbe2-725e243422ca	3a18186f-2e6a-467b-88c2-bc3e89045225	Rótulas
28dbd67b-416f-444b-8a26-f7128d276b60	3a18186f-2e6a-467b-88c2-bc3e89045225	Bujes
1081f804-b5fc-4a5a-b831-9b646c114b6f	3a18186f-2e6a-467b-88c2-bc3e89045225	Barras
26e033b3-7763-48e9-a806-9601800650a4	25bccf8f-95f2-4510-84f1-f2ba7eefd95f	Pastillas
ec4b756a-7ebd-4d2b-9d55-88f467a6fbd8	25bccf8f-95f2-4510-84f1-f2ba7eefd95f	Discos
12805322-9084-4f80-b643-0e187ba57bce	25bccf8f-95f2-4510-84f1-f2ba7eefd95f	Tambores
c6cd62ef-690b-4afa-b98e-487f464cdae5	25bccf8f-95f2-4510-84f1-f2ba7eefd95f	Líquido de frenos
5ddf2e0f-9803-4e73-b2c0-48e924c8a57c	25bccf8f-95f2-4510-84f1-f2ba7eefd95f	Calibradores
a32837d3-d716-41ab-97f0-4e4b40aeb567	9622cfdb-f8ce-4a83-919a-3ba79d06727f	Alternador
7e15fa26-a803-4023-82ed-d32928d6fe5c	9622cfdb-f8ce-4a83-919a-3ba79d06727f	Motor de arranque
a9f1c349-9295-4608-bb94-6120289d8dab	9622cfdb-f8ce-4a83-919a-3ba79d06727f	Batería
facdb87c-245e-4412-8c10-254834123d4c	9622cfdb-f8ce-4a83-919a-3ba79d06727f	Bobinas
396f6c9c-ec69-4426-8a14-fdcc970c3dae	9622cfdb-f8ce-4a83-919a-3ba79d06727f	Sensores
95fd9707-f975-416b-9725-447651266304	0480c124-33be-476c-9f22-b69f85530443	Parachoques
a7adb340-488b-4aa3-b496-9aea8b767a42	0480c124-33be-476c-9f22-b69f85530443	Guardafangos
e0e1dfa5-c798-4fd7-932f-3e1dd91ae509	0480c124-33be-476c-9f22-b69f85530443	Capó
fcf79e33-500d-4b8c-a2d7-4bc53752bc53	0480c124-33be-476c-9f22-b69f85530443	Puertas
04ffb4bd-8d7f-4c6c-8db1-b3bb85c7e49a	0480c124-33be-476c-9f22-b69f85530443	Espejos
fd317021-87c9-4b74-94bf-e193562183ee	402b98c6-3ad0-46cc-a1fa-6c4b3d7bd642	Faros
f134062e-41b5-4638-9f11-513b10c04c21	402b98c6-3ad0-46cc-a1fa-6c4b3d7bd642	Stops
816254d6-8700-420a-a74a-e7df7d7a9020	402b98c6-3ad0-46cc-a1fa-6c4b3d7bd642	Bombillos
b9c92e9e-4924-406a-a4e4-98aa22a53468	402b98c6-3ad0-46cc-a1fa-6c4b3d7bd642	Exploradoras
f798416d-e359-4b7e-9593-e7f31ee88d34	37155995-3398-44c6-aba0-42b367941304	Tapicería
b210ddfc-347a-4350-a8bc-28ba6b3ad0b1	37155995-3398-44c6-aba0-42b367941304	Tablero
92484a1d-4da6-451d-9c00-265a3d95aea4	37155995-3398-44c6-aba0-42b367941304	Alfombras
0ba0b273-3904-43c1-baba-214f3f9f9316	37155995-3398-44c6-aba0-42b367941304	Manillas
b2bd1d5f-9635-4002-9c7a-a8b2d9a3c9c4	11d1adc6-1405-41cf-8a59-6d5b423af98b	Cauchos
ca3f881c-2fab-4873-85fb-f68528475657	11d1adc6-1405-41cf-8a59-6d5b423af98b	Rines
03ce735e-647a-42a4-946a-cd5c56100f72	11d1adc6-1405-41cf-8a59-6d5b423af98b	Válvulas de aire
41a06565-6005-445f-bf5c-89710ddba060	89229bd4-0478-48b4-8668-a33d9d0949a9	Filtro de aceite
84d6847a-1773-4714-82ae-ad68baa37f0a	89229bd4-0478-48b4-8668-a33d9d0949a9	Filtro de aire
e269a9df-549c-4355-9d97-9d82e7b33531	89229bd4-0478-48b4-8668-a33d9d0949a9	Filtro de combustible
fd8083b8-8478-48da-901e-2e63ff1ac04e	89229bd4-0478-48b4-8668-a33d9d0949a9	Filtro de cabina
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (id, token, user_id, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.plans (id, name, description, price, billing_cycle, is_active) FROM stdin;
00000000-0000-0000-0000-000000000001	Plan Básico	Plan gratuito con funcionalidades básicas	0	monthly	t
00000000-0000-0000-0000-000000000002	Plan Premium	Plan premium con todas las funcionalidades	9.99	monthly	t
\.


--
-- Data for Name: request_ratings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.request_ratings (id, request_id, client_id, vendor_id, rating, comment, created_at) FROM stdin;
35d71c22-aa8f-4e29-a837-39cf89b81f30	932428c3-a0a3-4648-86ca-e08d79c86153	51037da5-29dc-4684-ad0f-a460352261ec	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	3	\N	2026-04-21 19:26:45.971
d0d16e26-4a78-405a-9201-fd3291d4c29c	dd3f35fc-82bc-4b23-949c-0530ae67d643	892c5e81-8af4-425e-856f-d1a0e826f892	9b28fc49-c10e-43ca-b940-7acd2d858bbc	5	\N	2026-04-21 19:40:58.015
43a61b04-0d35-4752-868a-b48617d4ae84	b8cf7a18-5b24-4850-aa35-ade12b94dd34	51037da5-29dc-4684-ad0f-a460352261ec	9b28fc49-c10e-43ca-b940-7acd2d858bbc	4	Excelente	2026-04-21 20:19:57.861
a440cef2-12da-43de-ba35-6930050adb2c	3dd3a74a-4a71-4227-b6cf-58a2d6db4b27	51037da5-29dc-4684-ad0f-a460352261ec	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	5	Excelente	2026-04-21 20:20:56.705
28b04183-61e6-40bb-83f5-e2f964e00f04	17522d48-4b02-478c-8d73-bde6031ddcb9	51037da5-29dc-4684-ad0f-a460352261ec	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	5	Ok	2026-04-21 20:23:04.475
c9b09e94-76ac-46ce-b6b3-2d05397332ba	887e2a6c-eb9f-47da-8236-3ad2155c4f6c	804b2420-2e52-4ab4-834d-5132029a20d0	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	5	Excelente	2026-04-21 23:16:22.45
\.


--
-- Data for Name: request_responses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.request_responses (id, request_id, vendor_id, initial_message, created_at) FROM stdin;
06562240-e54b-46e0-89b9-dccfedba9f0f	4f0e2b0f-1f5d-4a09-a787-6b69441842c2	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	Si lo tengo Disponible	2026-04-21 17:30:35.844
0bc35039-e06b-4250-872a-3096a75773c4	dd3f35fc-82bc-4b23-949c-0530ae67d643	9b28fc49-c10e-43ca-b940-7acd2d858bbc	Lo tengo disponible 80$	2026-04-21 19:11:25.966
c733968f-8a90-48c8-8b02-90952464cb4e	3dd3a74a-4a71-4227-b6cf-58a2d6db4b27	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	Si lo tengo disponible	2026-04-21 19:12:08.878
7cba4b6a-8a40-45b5-bb2f-5d36b028f773	932428c3-a0a3-4648-86ca-e08d79c86153	9b28fc49-c10e-43ca-b940-7acd2d858bbc	La tengo 80$	2026-04-21 19:20:20.619
7889ab0f-dccb-4930-b43b-316c19c3aa66	932428c3-a0a3-4648-86ca-e08d79c86153	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	Si tengo Barataaaaaaa	2026-04-21 19:20:41.886
221c557a-3e61-4f55-afa4-53edc248d5c7	b8cf7a18-5b24-4850-aa35-ade12b94dd34	9b28fc49-c10e-43ca-b940-7acd2d858bbc	De plástico te sirve ?	2026-04-21 20:09:07.935
77aa7e18-b235-4a5e-84a5-5f7ca2906c2c	17522d48-4b02-478c-8d73-bde6031ddcb9	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	Si lo tengo	2026-04-21 20:22:37.164
b98bec10-762c-467e-bd4c-ff473b88b645	887e2a6c-eb9f-47da-8236-3ad2155c4f6c	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	Si.lo tengo	2026-04-21 23:12:30.519
\.


--
-- Data for Name: request_vendor_matches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.request_vendor_matches (id, request_id, vendor_id, delivered_at, responded, declined, responded_at, declined_at) FROM stdin;
2590d465-5798-4cb0-a060-90d3ac4eec6e	48d165c9-73d0-4216-8d73-308e6c0ca0f7	784876c3-1fac-4aee-a85c-622d65f0bf47	2026-04-21 17:10:52.677	f	f	\N	\N
5ec30fb4-4dc1-4d60-992d-c6db3d8ba3c6	255901d6-e64f-49fb-9185-e1bb7694db87	784876c3-1fac-4aee-a85c-622d65f0bf47	2026-04-21 17:20:09.323	f	f	\N	\N
9b2f0bcb-4bc4-4960-863f-4ea6deda0fe4	4f0e2b0f-1f5d-4a09-a787-6b69441842c2	784876c3-1fac-4aee-a85c-622d65f0bf47	2026-04-21 17:30:03.534	f	f	\N	\N
c843f00a-517e-4eaa-9b4d-117fc13f9e54	4f0e2b0f-1f5d-4a09-a787-6b69441842c2	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	2026-04-21 17:30:03.534	t	f	2026-04-21 17:30:35.85	\N
d87e3598-6b00-4345-b135-443291e591d1	5370d08b-5b44-4f28-ab6e-d01f5dbfdb1a	784876c3-1fac-4aee-a85c-622d65f0bf47	2026-04-21 17:52:03.343	f	f	\N	\N
bfa4d716-f85b-40d1-a1f1-7c07b5728b9e	dd3f35fc-82bc-4b23-949c-0530ae67d643	784876c3-1fac-4aee-a85c-622d65f0bf47	2026-04-21 17:54:24.673	f	f	\N	\N
314169c2-e32f-4abe-aac1-25dd54451363	255901d6-e64f-49fb-9185-e1bb7694db87	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	2026-04-21 17:20:09.323	f	t	\N	2026-04-21 19:05:51.991
20fff15a-1e8b-4598-af4d-666d5e768b18	3dd3a74a-4a71-4227-b6cf-58a2d6db4b27	784876c3-1fac-4aee-a85c-622d65f0bf47	2026-04-21 19:11:01.29	f	f	\N	\N
72bf4f28-a811-4cdb-a229-df683fd926d7	dd3f35fc-82bc-4b23-949c-0530ae67d643	9b28fc49-c10e-43ca-b940-7acd2d858bbc	2026-04-21 17:54:24.673	t	f	2026-04-21 19:11:25.971	\N
ac3b16b7-0fb4-457b-ad22-1812821210e1	3dd3a74a-4a71-4227-b6cf-58a2d6db4b27	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	2026-04-21 19:11:01.29	t	f	2026-04-21 19:12:08.883	\N
7562338e-dc1e-4a4a-8ae0-22e52ec131f8	5370d08b-5b44-4f28-ab6e-d01f5dbfdb1a	9b28fc49-c10e-43ca-b940-7acd2d858bbc	2026-04-21 17:52:03.343	f	t	\N	2026-04-21 19:14:37.646
1c914043-5346-45f0-ad19-0814763d0f49	932428c3-a0a3-4648-86ca-e08d79c86153	784876c3-1fac-4aee-a85c-622d65f0bf47	2026-04-21 19:19:32.49	f	f	\N	\N
08e36933-fa8a-491c-b3b5-7d8c26c29cd0	932428c3-a0a3-4648-86ca-e08d79c86153	9b28fc49-c10e-43ca-b940-7acd2d858bbc	2026-04-21 19:19:32.49	t	f	2026-04-21 19:20:20.624	\N
ff42cc97-3801-45f3-9fa5-e4f2c3c5a7b0	932428c3-a0a3-4648-86ca-e08d79c86153	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	2026-04-21 19:19:32.49	t	f	2026-04-21 19:20:41.89	\N
67175259-356c-425f-afbc-f24294be54b8	b8cf7a18-5b24-4850-aa35-ade12b94dd34	784876c3-1fac-4aee-a85c-622d65f0bf47	2026-04-21 20:06:56.875	f	f	\N	\N
82e49882-a7bb-45a0-b500-3e4a104282b2	b8cf7a18-5b24-4850-aa35-ade12b94dd34	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	2026-04-21 20:06:56.875	f	t	\N	2026-04-21 20:08:26.54
742bce52-6839-4f0e-ba2e-6889a35041f1	b8cf7a18-5b24-4850-aa35-ade12b94dd34	9b28fc49-c10e-43ca-b940-7acd2d858bbc	2026-04-21 20:06:56.875	t	f	2026-04-21 20:09:07.941	\N
7edaad98-48e6-4a38-9fac-1a63120cf181	17522d48-4b02-478c-8d73-bde6031ddcb9	9b28fc49-c10e-43ca-b940-7acd2d858bbc	2026-04-21 20:22:13.983	f	f	\N	\N
20d75655-dbc6-48a2-993b-1499ef05905c	17522d48-4b02-478c-8d73-bde6031ddcb9	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	2026-04-21 20:22:13.983	t	f	2026-04-21 20:22:37.169	\N
a5ef9b92-40e2-4b9b-aa67-4a9aec2b2221	dc0c4641-a8f8-46f7-bc8b-37832bfdb323	784876c3-1fac-4aee-a85c-622d65f0bf47	2026-04-21 20:56:55.747	f	f	\N	\N
88edc39a-e42e-40f8-a2c3-4c364798ce4c	dc0c4641-a8f8-46f7-bc8b-37832bfdb323	74d2dc38-518a-4993-8610-97be0b0f3e1a	2026-04-21 20:56:55.747	f	f	\N	\N
83369285-57ed-4c96-9afa-b8d5e1cbe869	e7f3204d-ea3d-47ef-befc-675cf18ffc38	784876c3-1fac-4aee-a85c-622d65f0bf47	2026-04-21 21:25:32.291	f	f	\N	\N
9460981d-3ae9-4246-843d-cc80494838e6	e7f3204d-ea3d-47ef-befc-675cf18ffc38	74d2dc38-518a-4993-8610-97be0b0f3e1a	2026-04-21 21:25:32.291	f	f	\N	\N
6ccf7327-fd2f-4671-aa91-226f6608b9d3	8dfd8663-1d63-4263-aef5-fc10bd09609d	74d2dc38-518a-4993-8610-97be0b0f3e1a	2026-04-21 22:49:42.868	f	f	\N	\N
8a73a765-e6b0-46d8-ac94-eb8881f4d983	887e2a6c-eb9f-47da-8236-3ad2155c4f6c	784876c3-1fac-4aee-a85c-622d65f0bf47	2026-04-21 23:11:50.968	f	f	\N	\N
7c060724-f3d5-4a43-87a8-4a25349df928	887e2a6c-eb9f-47da-8236-3ad2155c4f6c	74d2dc38-518a-4993-8610-97be0b0f3e1a	2026-04-21 23:11:50.968	f	f	\N	\N
acd71e39-bb7f-4264-b206-e52581f191f5	887e2a6c-eb9f-47da-8236-3ad2155c4f6c	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	2026-04-21 23:11:50.968	t	f	2026-04-21 23:12:30.532	\N
aace3b8d-c54e-4e82-9bfa-1627c3b98535	a87455e5-e7c6-4bbc-9dee-294bb21a3835	784876c3-1fac-4aee-a85c-622d65f0bf47	2026-04-21 23:17:18.837	f	f	\N	\N
4704d45f-10d0-421b-8ada-ebf42135f469	a87455e5-e7c6-4bbc-9dee-294bb21a3835	74d2dc38-518a-4993-8610-97be0b0f3e1a	2026-04-21 23:17:18.837	f	f	\N	\N
\.


--
-- Data for Name: requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.requests (id, client_id, vehicle_brand_id, vehicle_model_id, part_category_id, part_subcategory_id, state_id, municipality_id, search_radius_km, free_description, status, created_at, closed_at) FROM stdin;
48d165c9-73d0-4216-8d73-308e6c0ca0f7	8403454c-7c5f-4e5a-8900-43f317d23bf4	470c9f7b-da30-4f54-bc11-bb33c335dfdd	f8d6769c-2864-4eef-b82f-c68a62eb1e1a	0480c124-33be-476c-9f22-b69f85530443	e0e1dfa5-c798-4fd7-932f-3e1dd91ae509	\N	\N	5	De fibra de carbono	ABIERTA	2026-04-21 17:10:52.673	\N
7231a2f2-7566-40f1-9580-482911f95f5c	c2cc95c3-1903-4f50-9175-2f551c7f6812	25d915ca-1579-4802-9ced-c4059f5a1365	ab7f9a63-ea44-46bf-8109-74760268252f	0480c124-33be-476c-9f22-b69f85530443	04ffb4bd-8d7f-4c6c-8db1-b3bb85c7e49a	\N	\N	5	laterales	ABIERTA	2026-04-21 17:19:49.612	\N
255901d6-e64f-49fb-9185-e1bb7694db87	44e9c956-5fa3-45c8-ade7-f8c8e9833957	470c9f7b-da30-4f54-bc11-bb33c335dfdd	f8d6769c-2864-4eef-b82f-c68a62eb1e1a	0480c124-33be-476c-9f22-b69f85530443	04ffb4bd-8d7f-4c6c-8db1-b3bb85c7e49a	\N	\N	5	Retrovisor tracero Aveo 2010	ABIERTA	2026-04-21 17:20:09.32	\N
4f0e2b0f-1f5d-4a09-a787-6b69441842c2	c2cc95c3-1903-4f50-9175-2f551c7f6812	470c9f7b-da30-4f54-bc11-bb33c335dfdd	f8d6769c-2864-4eef-b82f-c68a62eb1e1a	9622cfdb-f8ce-4a83-919a-3ba79d06727f	a32837d3-d716-41ab-97f0-4e4b40aeb567	\N	\N	5	carbonera	EN_PROCESO	2026-04-21 17:30:03.53	\N
932428c3-a0a3-4648-86ca-e08d79c86153	51037da5-29dc-4684-ad0f-a460352261ec	470c9f7b-da30-4f54-bc11-bb33c335dfdd	f8d6769c-2864-4eef-b82f-c68a62eb1e1a	9622cfdb-f8ce-4a83-919a-3ba79d06727f	a9f1c349-9295-4608-bb94-6120289d8dab	\N	\N	5	Batería de 800 AMP	CERRADA	2026-04-21 19:19:32.486	2026-04-21 19:26:45.975
dd3f35fc-82bc-4b23-949c-0530ae67d643	892c5e81-8af4-425e-856f-d1a0e826f892	470c9f7b-da30-4f54-bc11-bb33c335dfdd	f8d6769c-2864-4eef-b82f-c68a62eb1e1a	9622cfdb-f8ce-4a83-919a-3ba79d06727f	a9f1c349-9295-4608-bb94-6120289d8dab	\N	\N	5	1000amp	CERRADA	2026-04-21 17:54:24.669	2026-04-21 19:40:58.022
b8cf7a18-5b24-4850-aa35-ade12b94dd34	51037da5-29dc-4684-ad0f-a460352261ec	f5e658fb-12db-452f-9cd9-cd0b05e2ffa0	4bfb0763-947c-4336-8aa0-cbea6d44d07c	89229bd4-0478-48b4-8668-a33d9d0949a9	41a06565-6005-445f-bf5c-89710ddba060	\N	\N	5	Ksjdvdlskw	CERRADA	2026-04-21 20:06:56.87	2026-04-21 20:19:57.868
3dd3a74a-4a71-4227-b6cf-58a2d6db4b27	51037da5-29dc-4684-ad0f-a460352261ec	470c9f7b-da30-4f54-bc11-bb33c335dfdd	f8d6769c-2864-4eef-b82f-c68a62eb1e1a	0480c124-33be-476c-9f22-b69f85530443	04ffb4bd-8d7f-4c6c-8db1-b3bb85c7e49a	\N	\N	5	Ixxkxyykyy	CERRADA	2026-04-21 19:11:01.287	2026-04-21 20:20:56.709
17522d48-4b02-478c-8d73-bde6031ddcb9	51037da5-29dc-4684-ad0f-a460352261ec	2ed7734f-2873-4b1b-8ac0-bf5a86319358	2dd116bd-0c15-473b-a4ef-e314f3c8ca07	89229bd4-0478-48b4-8668-a33d9d0949a9	84d6847a-1773-4714-82ae-ad68baa37f0a	\N	\N	5	Higkhgjnn	CERRADA	2026-04-21 20:22:13.98	2026-04-21 20:23:04.478
dc0c4641-a8f8-46f7-bc8b-37832bfdb323	892c5e81-8af4-425e-856f-d1a0e826f892	470c9f7b-da30-4f54-bc11-bb33c335dfdd	ffc814d2-1db3-4701-b215-eb5629e247fb	72f7e625-7d64-4e7f-b30f-3f86b9d50922	2dd01ce2-06f1-4e8d-8e9c-702b130c45cc	\N	\N	5	Pohhggjñg hcjutr dtbgh	ABIERTA	2026-04-21 20:56:55.743	\N
e7f3204d-ea3d-47ef-befc-675cf18ffc38	892c5e81-8af4-425e-856f-d1a0e826f892	1b7eb55a-9c6d-429b-a556-6c1b1f0a5824	e136e1d1-bada-4397-b38e-3d4b0612e701	25bccf8f-95f2-4510-84f1-f2ba7eefd95f	ec4b756a-7ebd-4d2b-9d55-88f467a6fbd8	\N	\N	5	Los discos delanteros	ABIERTA	2026-04-21 21:25:32.285	\N
8dfd8663-1d63-4263-aef5-fc10bd09609d	892c5e81-8af4-425e-856f-d1a0e826f892	c263ded3-3c1a-4649-9359-c6f31ab42026	be037d00-0cfd-4272-8230-ba8f70a01ab6	25bccf8f-95f2-4510-84f1-f2ba7eefd95f	26e033b3-7763-48e9-a806-9601800650a4	\N	\N	5	Busco las pastillas delanteros	ABIERTA	2026-04-21 22:49:42.857	\N
5370d08b-5b44-4f28-ab6e-d01f5dbfdb1a	892c5e81-8af4-425e-856f-d1a0e826f892	470c9f7b-da30-4f54-bc11-bb33c335dfdd	f8d6769c-2864-4eef-b82f-c68a62eb1e1a	9622cfdb-f8ce-4a83-919a-3ba79d06727f	a32837d3-d716-41ab-97f0-4e4b40aeb567	\N	\N	5	105 amp	CERRADA	2026-04-21 17:52:03.332	2026-04-21 22:57:53.872
887e2a6c-eb9f-47da-8236-3ad2155c4f6c	804b2420-2e52-4ab4-834d-5132029a20d0	470c9f7b-da30-4f54-bc11-bb33c335dfdd	b022db16-1753-4570-9760-8f32f2bee1a0	402b98c6-3ad0-46cc-a1fa-6c4b3d7bd642	816254d6-8700-420a-a74a-e7df7d7a9020	\N	\N	5	Necesito de 40000 Lm	CERRADA	2026-04-21 23:11:50.958	2026-04-21 23:16:22.461
a87455e5-e7c6-4bbc-9dee-294bb21a3835	804b2420-2e52-4ab4-834d-5132029a20d0	c263ded3-3c1a-4649-9359-c6f31ab42026	be037d00-0cfd-4272-8230-ba8f70a01ab6	9622cfdb-f8ce-4a83-919a-3ba79d06727f	a9f1c349-9295-4608-bb94-6120289d8dab	\N	\N	5	900 amperios	CERRADA	2026-04-21 23:17:18.828	2026-04-21 23:19:10.936
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name) FROM stdin;
074d7717-7a43-42cc-9b75-39b6fd1925d7	CLIENTE
ee1e375a-0a1b-43bb-9cd0-23145a76e88b	VENDEDOR
3dd414fc-e09a-4028-8a05-0edeeecaf45a	ADMIN
\.


--
-- Data for Name: states; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.states (id, name) FROM stdin;
edab9703-cc2a-4ff6-b266-017bf131bd44	Distrito Capital
938c178b-3023-4302-aa84-46711fbabe9a	Miranda
9061be39-7a95-45be-9fe8-331ffc7babd7	Carabobo
92d5c8b6-601d-4e5c-ae6e-62b8eb334828	Zulia
80345211-b5cf-40a6-bcfa-208ee132488e	Aragua
d666ef5a-652b-410c-87b0-112ade9878ba	Lara
964c9732-fb01-4473-8a7c-754e2d6e414f	Táchira
478d949d-5966-41e6-bffe-4b3478d75db7	Anzoátegui
2793385c-94c0-41c6-8caf-d3a2dd203778	Bolívar
5d78aaec-9650-4e44-bb38-de406bba0351	Mérida
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (id, user_id, role_id) FROM stdin;
97d395e6-18ea-4bc9-944f-f9d75e2c9910	2da7b616-4b2e-44db-9704-ddff2bfe8e4d	ee1e375a-0a1b-43bb-9cd0-23145a76e88b
e5f3f9b9-bc34-45b1-ba2b-023e6a7cbf22	8403454c-7c5f-4e5a-8900-43f317d23bf4	074d7717-7a43-42cc-9b75-39b6fd1925d7
8528cf5e-52ea-45e7-a675-5ce8e8b6f608	892c5e81-8af4-425e-856f-d1a0e826f892	ee1e375a-0a1b-43bb-9cd0-23145a76e88b
3f4d955d-87e9-4a00-b926-435e1cf348e8	44e9c956-5fa3-45c8-ade7-f8c8e9833957	074d7717-7a43-42cc-9b75-39b6fd1925d7
8bbcb648-1b36-4016-8562-7ae7bb5947a6	c2cc95c3-1903-4f50-9175-2f551c7f6812	074d7717-7a43-42cc-9b75-39b6fd1925d7
c3dda53c-1e5c-4774-bc4b-d71aa5782e31	604e58ec-58d4-4fc0-b367-9886d6ee2e26	ee1e375a-0a1b-43bb-9cd0-23145a76e88b
b8d38426-3e21-41f4-ac4d-6919621803ef	2da7b616-4b2e-44db-9704-ddff2bfe8e4d	074d7717-7a43-42cc-9b75-39b6fd1925d7
4799251d-5f7e-4c78-a365-7926149ce796	892c5e81-8af4-425e-856f-d1a0e826f892	074d7717-7a43-42cc-9b75-39b6fd1925d7
c21a4af6-17c4-439d-8bc0-24cfa92bf7d2	604e58ec-58d4-4fc0-b367-9886d6ee2e26	074d7717-7a43-42cc-9b75-39b6fd1925d7
6076989c-5551-4995-8098-427b0182065c	51037da5-29dc-4684-ad0f-a460352261ec	ee1e375a-0a1b-43bb-9cd0-23145a76e88b
907a6f61-9b96-4327-a807-c10d7f4e90dd	51037da5-29dc-4684-ad0f-a460352261ec	074d7717-7a43-42cc-9b75-39b6fd1925d7
2f1d9e45-4489-43d3-8076-a062caf0e6dc	804b2420-2e52-4ab4-834d-5132029a20d0	ee1e375a-0a1b-43bb-9cd0-23145a76e88b
216e3208-9db4-486d-b349-f1c84bc7fca7	804b2420-2e52-4ab4-834d-5132029a20d0	074d7717-7a43-42cc-9b75-39b6fd1925d7
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password, first_name, last_name, name, phone, document_id, is_active, created_at, updated_at, email_verified) FROM stdin;
824abc9a-cf65-4347-8a8e-799766cbf328	john@doe.com	$2b$10$EqXahrCRg1bgG5h8gp3eiO/NtHj.5lUhIGfGXE4SMHxGH1kzJeYty	John	Doe	John Doe	+58412000000	V-12345678	t	2026-04-14 19:31:12.823	2026-04-14 19:31:12.823	f
2da7b616-4b2e-44db-9704-ddff2bfe8e4d	Eliezer@gmail.com	$2b$10$q3Sh.4veYFNPaXuYiJFineU9MT.H7A3BNdLObvi8ys.MvCJYNJHH2	Eliezer	Andrades	Eliezer Andrades	+58-412-579-65-38	36985214	t	2026-04-21 17:05:41.328	2026-04-21 17:05:41.328	t
8403454c-7c5f-4e5a-8900-43f317d23bf4	Jose@gmail.com	$2b$10$kJlbeYxTFLSeKBVNoTQbDuPS0ibUEXMFT6YBROWoJJsxcWDi.EyR2	Jose	Acevedo	Jose Acevedo	+58-424-685-23-98	16365478	t	2026-04-21 17:10:19.414	2026-04-21 17:10:19.414	t
892c5e81-8af4-425e-856f-d1a0e826f892	Elian@gmail.com	$2b$10$cJHLf0NyhVpIF67WyJFE9uXuQfJglXgtb7wr05heBn56Y1xUO53yO	Elian	Paz	Elian Paz	+58-422-526-98-78	37562149	t	2026-04-21 17:16:50.527	2026-04-21 17:16:50.527	t
44e9c956-5fa3-45c8-ade7-f8c8e9833957	master1702@gmail.com	$2b$10$ptnVJdiEU5dyCb4d5PKwkuXx7s/HmMT/8svm4eeoD/kxhid1lGgN2	Pedro	Cohen	Pedro Cohen	+58-414-630-50-56	17094732	t	2026-04-21 17:18:07.085	2026-04-21 17:18:07.085	t
c2cc95c3-1903-4f50-9175-2f551c7f6812	sarainez@hotmail.com	$2b$10$ufrejgLfqDs1SAAyYn3UP./SF.2htdBxN8XwPNRbNnrmk3wBftL0.	Sara Inez	Naveda	Sara Inez Naveda	+58-414-619-11-55	29333555	t	2026-04-21 17:18:40.82	2026-04-21 17:18:40.82	t
604e58ec-58d4-4fc0-b367-9886d6ee2e26	jesusn@hotmail.com	$2b$10$/6FvGH0PznoUi5LAbIJBt.yl4GwejOSyWlySNpuS3z8ElehnEhqju	Jesus	Naveda	Jesus Naveda	+58-424-555-22-22	9252808	t	2026-04-21 17:41:28.322	2026-04-21 17:41:28.322	t
51037da5-29dc-4684-ad0f-a460352261ec	pcohenc.a@gmail.com	$2b$10$Acftxvw6ccRY9d542hC8KeJJP1BpFxKfiq2l2QW7W9A/237dUsG3W	Pedro	Cohen	Pedro Cohen	+58-414-630-50-56	17094732	t	2026-04-21 19:02:55.619	2026-04-21 19:02:55.619	t
804b2420-2e52-4ab4-834d-5132029a20d0	Josec@gmail.com	$2b$10$1aFCOcvl2LjN086edGpEbuMHi2SIz2hjdAwBbVajxjkQjS5PmfVjq	Jose	Acevedo	Jose Acevedo	+58-412-686-70-76	10254783	t	2026-04-21 23:08:16.723	2026-04-21 23:08:16.723	t
\.


--
-- Data for Name: vehicle_brands; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicle_brands (id, name) FROM stdin;
2ed7734f-2873-4b1b-8ac0-bf5a86319358	Toyota
f5e658fb-12db-452f-9cd9-cd0b05e2ffa0	Ford
470c9f7b-da30-4f54-bc11-bb33c335dfdd	Chevrolet
b4dd2696-2d32-457a-b650-a03f2d373ffa	Nissan
1b7eb55a-9c6d-429b-a556-6c1b1f0a5824	Honda
43a36a87-522e-44cc-b273-ea7002647a4f	Hyundai
b5d9c807-574e-4a15-b615-b21094dfcb28	Kia
c263ded3-3c1a-4649-9359-c6f31ab42026	Mazda
c5527510-1f63-49e6-b875-d6fbe9ec5fc7	Volkswagen
25d915ca-1579-4802-9ced-c4059f5a1365	Renault
\.


--
-- Data for Name: vehicle_models; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicle_models (id, brand_id, name) FROM stdin;
113189e5-6064-4de5-8f07-66f43b7b82dd	2ed7734f-2873-4b1b-8ac0-bf5a86319358	Corolla
c36ab7a9-2f99-41bd-a04c-fbdd5dc41cbd	2ed7734f-2873-4b1b-8ac0-bf5a86319358	Camry
75c618fe-f940-4b18-938d-76be21c588a2	2ed7734f-2873-4b1b-8ac0-bf5a86319358	RAV4
d0f805f0-4e96-4db3-86dc-0ab92b298bb2	2ed7734f-2873-4b1b-8ac0-bf5a86319358	Hilux
2dd116bd-0c15-473b-a4ef-e314f3c8ca07	2ed7734f-2873-4b1b-8ac0-bf5a86319358	Yaris
b9eab9e5-c3cf-42a7-8215-c0ac84687cb1	f5e658fb-12db-452f-9cd9-cd0b05e2ffa0	F-150
8950a3bf-bd2c-45fa-b2b7-c62dc81715a0	f5e658fb-12db-452f-9cd9-cd0b05e2ffa0	Explorer
8f32f290-717d-42fb-92f7-1f93f81d99f4	f5e658fb-12db-452f-9cd9-cd0b05e2ffa0	Mustang
4bfb0763-947c-4336-8aa0-cbea6d44d07c	f5e658fb-12db-452f-9cd9-cd0b05e2ffa0	Fiesta
14f9ee2b-b75a-44f0-abfb-c5831a8a0eee	f5e658fb-12db-452f-9cd9-cd0b05e2ffa0	Focus
fdfb9ef3-828f-4d59-ad44-3f7c2b13e57e	470c9f7b-da30-4f54-bc11-bb33c335dfdd	Silverado
b022db16-1753-4570-9760-8f32f2bee1a0	470c9f7b-da30-4f54-bc11-bb33c335dfdd	Cruze
c5362013-d69d-4afc-8ee7-5b1c14efb012	470c9f7b-da30-4f54-bc11-bb33c335dfdd	Spark
f8d6769c-2864-4eef-b82f-c68a62eb1e1a	470c9f7b-da30-4f54-bc11-bb33c335dfdd	Aveo
ffc814d2-1db3-4701-b215-eb5629e247fb	470c9f7b-da30-4f54-bc11-bb33c335dfdd	Captiva
6da92098-f6c6-41ab-9c1c-055b8d6a5c14	b4dd2696-2d32-457a-b650-a03f2d373ffa	Sentra
41055ea6-e2b1-4ed0-83b1-89499755b487	b4dd2696-2d32-457a-b650-a03f2d373ffa	Versa
2a88029e-3fa3-455f-8f3b-d8db3c2e6f2d	b4dd2696-2d32-457a-b650-a03f2d373ffa	Frontier
750a0fbb-ef7a-49d8-b9c3-09d01a95d1f9	b4dd2696-2d32-457a-b650-a03f2d373ffa	Pathfinder
4dbc65f5-072a-4818-aced-4482cf9686c0	b4dd2696-2d32-457a-b650-a03f2d373ffa	March
bb528b9c-0d2a-4fc8-8999-c99db58b7ab0	1b7eb55a-9c6d-429b-a556-6c1b1f0a5824	Civic
e136e1d1-bada-4397-b38e-3d4b0612e701	1b7eb55a-9c6d-429b-a556-6c1b1f0a5824	Accord
efde7414-16d4-4ac3-9970-7d93ac76045b	1b7eb55a-9c6d-429b-a556-6c1b1f0a5824	CR-V
edd95e71-400c-4966-b120-dc85bb003093	1b7eb55a-9c6d-429b-a556-6c1b1f0a5824	Fit
94ed8e3c-b9e9-4a3e-9d3b-2d14b87c559b	1b7eb55a-9c6d-429b-a556-6c1b1f0a5824	HR-V
0d285320-90a7-4ddb-b498-f728a6c0610b	43a36a87-522e-44cc-b273-ea7002647a4f	Tucson
e3d38a1d-3487-4ba0-9afc-806927380547	43a36a87-522e-44cc-b273-ea7002647a4f	Elantra
733af90e-f6f1-46f7-bb3d-3e951e5fbf3c	43a36a87-522e-44cc-b273-ea7002647a4f	Accent
50535620-18d3-414d-811b-35f54f4b8d4f	43a36a87-522e-44cc-b273-ea7002647a4f	Santa Fe
e8abd400-64fd-4751-9a17-42e95536d408	43a36a87-522e-44cc-b273-ea7002647a4f	Creta
85e84938-7755-43a0-91e5-eceb350364e0	b5d9c807-574e-4a15-b615-b21094dfcb28	Sportage
ea3a09d7-5684-42ec-8234-a0c49cd327f6	b5d9c807-574e-4a15-b615-b21094dfcb28	Rio
7246ec87-fc53-4c26-aca4-f9a88f71b3ce	b5d9c807-574e-4a15-b615-b21094dfcb28	Cerato
32e4a2c6-0eeb-42c3-be0c-68645c30b348	b5d9c807-574e-4a15-b615-b21094dfcb28	Sorento
2cad2486-4603-4b49-ab7a-f751461f8638	b5d9c807-574e-4a15-b615-b21094dfcb28	Picanto
be037d00-0cfd-4272-8230-ba8f70a01ab6	c263ded3-3c1a-4649-9359-c6f31ab42026	3
3268e39c-6d9a-4833-964b-b6bba7fcc95e	c263ded3-3c1a-4649-9359-c6f31ab42026	6
207f6dc1-3816-49ee-b12b-161515ddc653	c263ded3-3c1a-4649-9359-c6f31ab42026	CX-5
15b70ef2-7035-48ef-9ca0-6c02b832499f	c263ded3-3c1a-4649-9359-c6f31ab42026	CX-3
dc89d91d-205c-422a-a092-fed4e33ba124	c263ded3-3c1a-4649-9359-c6f31ab42026	2
ef674851-46b3-4c89-9fae-abaa95d9fe99	c5527510-1f63-49e6-b875-d6fbe9ec5fc7	Gol
db57e161-8244-4fbf-8889-90c7c9932985	c5527510-1f63-49e6-b875-d6fbe9ec5fc7	Jetta
b8e12448-9480-41b9-a9e4-e835fa1ab2e2	c5527510-1f63-49e6-b875-d6fbe9ec5fc7	Tiguan
47513cf1-acd9-4d88-b935-d0d0f123ef92	c5527510-1f63-49e6-b875-d6fbe9ec5fc7	Polo
aa7d2cd4-7623-4d7a-bebb-b4de3b5527f4	c5527510-1f63-49e6-b875-d6fbe9ec5fc7	Amarok
ab7f9a63-ea44-46bf-8109-74760268252f	25d915ca-1579-4802-9ced-c4059f5a1365	Logan
ed795af2-6985-4d88-9196-bf498d396a9c	25d915ca-1579-4802-9ced-c4059f5a1365	Sandero
8780f38d-a310-457f-998c-5564d6ba075b	25d915ca-1579-4802-9ced-c4059f5a1365	Duster
5f312c50-0371-4d67-b81b-bc850b049aad	25d915ca-1579-4802-9ced-c4059f5a1365	Captur
c03676d3-e2b7-417c-98ab-5c2de91b6ad9	25d915ca-1579-4802-9ced-c4059f5a1365	Kwid
\.


--
-- Data for Name: vendor_metrics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendor_metrics (id, vendor_id, total_requests_received, total_requests_answered, avg_rating, total_ratings, last_activity_at) FROM stdin;
052c207c-e328-406c-8db2-ee29255558fb	9b28fc49-c10e-43ca-b940-7acd2d858bbc	5	3	4.5	2	2026-04-21 20:09:07.945
1619485b-1feb-4692-973d-d4823be50fa8	e8af777f-1ebf-483c-a6ba-f6d96538f101	0	0	\N	0	\N
0cceeade-544a-43da-9ddc-d1f8f925ffe7	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	7	5	4.5	4	2026-04-21 23:12:30.54
7d439466-e48e-4ea0-9d88-160e263d8e8e	784876c3-1fac-4aee-a85c-622d65f0bf47	12	0	\N	0	\N
4ce38b45-e812-467e-a389-d2cf71cf5475	74d2dc38-518a-4993-8610-97be0b0f3e1a	5	0	\N	0	\N
\.


--
-- Data for Name: vendor_part_subcategories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendor_part_subcategories (id, vendor_id, part_subcategory_id) FROM stdin;
15457c72-e24f-4878-b5b5-ded2807b5fc6	784876c3-1fac-4aee-a85c-622d65f0bf47	e0e1dfa5-c798-4fd7-932f-3e1dd91ae509
9d3ffd53-7844-4c51-a0b6-3bb6fa2e7f05	784876c3-1fac-4aee-a85c-622d65f0bf47	04ffb4bd-8d7f-4c6c-8db1-b3bb85c7e49a
34555cf2-2ace-49ac-b638-0939b93067cf	784876c3-1fac-4aee-a85c-622d65f0bf47	a7adb340-488b-4aa3-b496-9aea8b767a42
b1193e61-e8ef-4f96-b2bf-0deae757faaa	784876c3-1fac-4aee-a85c-622d65f0bf47	a32837d3-d716-41ab-97f0-4e4b40aeb567
12213c88-0596-4339-b1cc-5242ac288e20	784876c3-1fac-4aee-a85c-622d65f0bf47	a9f1c349-9295-4608-bb94-6120289d8dab
7b33bf00-7ebb-47f9-89a4-452ecc3769ab	784876c3-1fac-4aee-a85c-622d65f0bf47	facdb87c-245e-4412-8c10-254834123d4c
490f561c-31ef-4b6a-8bab-b501516f3f50	784876c3-1fac-4aee-a85c-622d65f0bf47	41a06565-6005-445f-bf5c-89710ddba060
c322af3f-56b1-4acb-99e1-9810f257ab0a	784876c3-1fac-4aee-a85c-622d65f0bf47	84d6847a-1773-4714-82ae-ad68baa37f0a
209bf158-81d2-4023-8081-7e8172bd6b9a	784876c3-1fac-4aee-a85c-622d65f0bf47	fd8083b8-8478-48da-901e-2e63ff1ac04e
449c3889-2a70-4614-8593-f0519ba98368	784876c3-1fac-4aee-a85c-622d65f0bf47	5ddf2e0f-9803-4e73-b2c0-48e924c8a57c
200510d9-f392-47bd-b1ae-4b5a715ffdc0	784876c3-1fac-4aee-a85c-622d65f0bf47	ec4b756a-7ebd-4d2b-9d55-88f467a6fbd8
f7ab7553-16af-475a-85bc-094557eff2e6	784876c3-1fac-4aee-a85c-622d65f0bf47	c6cd62ef-690b-4afa-b98e-487f464cdae5
e40b3f74-8c36-4ef9-8f1a-93c2f6c62567	784876c3-1fac-4aee-a85c-622d65f0bf47	816254d6-8700-420a-a74a-e7df7d7a9020
0ee6ffda-89bd-4d0e-ac6e-c958c69cd6e2	784876c3-1fac-4aee-a85c-622d65f0bf47	b9c92e9e-4924-406a-a4e4-98aa22a53468
2c61bd47-b2d1-4234-8327-f496ced71223	784876c3-1fac-4aee-a85c-622d65f0bf47	fd317021-87c9-4b74-94bf-e193562183ee
58544777-c823-45d6-becd-83602ad51edb	784876c3-1fac-4aee-a85c-622d65f0bf47	92484a1d-4da6-451d-9c00-265a3d95aea4
2695aeb9-106c-4b37-b2a2-a4f5d1253d64	784876c3-1fac-4aee-a85c-622d65f0bf47	0ba0b273-3904-43c1-baba-214f3f9f9316
660eff1f-bdc5-495a-8083-f134212ed423	784876c3-1fac-4aee-a85c-622d65f0bf47	b210ddfc-347a-4350-a8bc-28ba6b3ad0b1
60e3534d-099c-4072-bdac-86f268133976	784876c3-1fac-4aee-a85c-622d65f0bf47	822d5352-c062-4bb5-a7b2-1698808521fc
f22d66ad-061b-4a56-8f48-a7c8eadb881d	784876c3-1fac-4aee-a85c-622d65f0bf47	ef810363-a515-4554-8ffe-aa01e8e01a14
6585e26b-636d-4114-a034-5764dffcf305	784876c3-1fac-4aee-a85c-622d65f0bf47	2dd01ce2-06f1-4e8d-8e9c-702b130c45cc
0ed9f4ef-5d9d-4a66-a1bc-9aa905c2e09b	784876c3-1fac-4aee-a85c-622d65f0bf47	b2bd1d5f-9635-4002-9c7a-a8b2d9a3c9c4
a1ec5dad-b995-4456-abb5-82b622b42b62	784876c3-1fac-4aee-a85c-622d65f0bf47	ca3f881c-2fab-4873-85fb-f68528475657
40b26434-58d2-444b-b0b9-2a5e28dbf20f	784876c3-1fac-4aee-a85c-622d65f0bf47	03ce735e-647a-42a4-946a-cd5c56100f72
e15053cc-205a-4602-9f44-b64c319ba821	784876c3-1fac-4aee-a85c-622d65f0bf47	aced3581-ee8d-49f0-b36f-bba03a9aa51c
8560fed2-d321-428b-a7d2-19b41a8c3fa0	784876c3-1fac-4aee-a85c-622d65f0bf47	1081f804-b5fc-4a5a-b831-9b646c114b6f
ce910db1-5694-43ad-bef2-5726a3429450	784876c3-1fac-4aee-a85c-622d65f0bf47	28dbd67b-416f-444b-8a26-f7128d276b60
31416666-0f3e-464e-b49b-96f34b270730	784876c3-1fac-4aee-a85c-622d65f0bf47	cd33bac7-d5cf-4624-8084-d9315dbb8125
45eb19b0-f640-45a9-9695-994ce3fbc923	784876c3-1fac-4aee-a85c-622d65f0bf47	fc8f5791-6042-41ad-9bd8-3bca1610f48c
93949da9-b8eb-40b9-bd46-359f4a74a9b2	784876c3-1fac-4aee-a85c-622d65f0bf47	3c5bef21-55dd-4499-85ca-ed81da008a0f
bd8c5674-1083-44f5-9503-7fe5d9e0ee75	9b28fc49-c10e-43ca-b940-7acd2d858bbc	a32837d3-d716-41ab-97f0-4e4b40aeb567
822f9447-4c99-4a67-974a-59059834ba1d	9b28fc49-c10e-43ca-b940-7acd2d858bbc	a9f1c349-9295-4608-bb94-6120289d8dab
dac990fb-2c60-48dc-86ab-19c29d524029	9b28fc49-c10e-43ca-b940-7acd2d858bbc	facdb87c-245e-4412-8c10-254834123d4c
96c39063-83f5-4ef7-a5c2-127207585e1a	9b28fc49-c10e-43ca-b940-7acd2d858bbc	7e15fa26-a803-4023-82ed-d32928d6fe5c
4ecbc49e-4dd2-428d-8872-f46118f03cff	9b28fc49-c10e-43ca-b940-7acd2d858bbc	396f6c9c-ec69-4426-8a14-fdcc970c3dae
aa21ffa2-6997-4137-996e-972d7eae1138	9b28fc49-c10e-43ca-b940-7acd2d858bbc	41a06565-6005-445f-bf5c-89710ddba060
f6dd9e2a-3f0c-4a08-903e-6815a7ac9d4a	9b28fc49-c10e-43ca-b940-7acd2d858bbc	84d6847a-1773-4714-82ae-ad68baa37f0a
40bcc8fe-0867-471b-92c5-408ad765a6c6	9b28fc49-c10e-43ca-b940-7acd2d858bbc	fd8083b8-8478-48da-901e-2e63ff1ac04e
e6a07c4b-fd40-4f1c-adbf-c0a30bf6c72c	9b28fc49-c10e-43ca-b940-7acd2d858bbc	e269a9df-549c-4355-9d97-9d82e7b33531
6044fe95-b7f9-4659-b89c-0e65156ff647	74d2dc38-518a-4993-8610-97be0b0f3e1a	a7adb340-488b-4aa3-b496-9aea8b767a42
f9ed0f58-819b-445d-8810-24102a69d958	74d2dc38-518a-4993-8610-97be0b0f3e1a	04ffb4bd-8d7f-4c6c-8db1-b3bb85c7e49a
682fe43d-eb06-48d7-9003-4a7ce28eacf9	74d2dc38-518a-4993-8610-97be0b0f3e1a	e0e1dfa5-c798-4fd7-932f-3e1dd91ae509
4e26a17f-ace7-475a-8492-c0fc98825a20	74d2dc38-518a-4993-8610-97be0b0f3e1a	b210ddfc-347a-4350-a8bc-28ba6b3ad0b1
e1cfde92-c9da-4686-89aa-771934c3a35e	74d2dc38-518a-4993-8610-97be0b0f3e1a	0ba0b273-3904-43c1-baba-214f3f9f9316
9c036ede-bb45-45ee-86e0-515a73031b45	74d2dc38-518a-4993-8610-97be0b0f3e1a	92484a1d-4da6-451d-9c00-265a3d95aea4
625aa961-7a5a-4a76-a082-c760afa64d50	74d2dc38-518a-4993-8610-97be0b0f3e1a	95fd9707-f975-416b-9725-447651266304
1e4bd607-667a-4e79-9b93-862e7366c75f	74d2dc38-518a-4993-8610-97be0b0f3e1a	7e15fa26-a803-4023-82ed-d32928d6fe5c
66aa0833-d297-4c25-9f0c-695c3a2a19e9	74d2dc38-518a-4993-8610-97be0b0f3e1a	facdb87c-245e-4412-8c10-254834123d4c
ea32fa00-43c6-4c67-b75e-ec268ed45427	74d2dc38-518a-4993-8610-97be0b0f3e1a	a9f1c349-9295-4608-bb94-6120289d8dab
c4f28cf0-1bcf-4fcb-a323-34367c26e5cd	74d2dc38-518a-4993-8610-97be0b0f3e1a	a32837d3-d716-41ab-97f0-4e4b40aeb567
6a9a7cfa-7ba7-491c-aeb5-8e4ac98d9826	74d2dc38-518a-4993-8610-97be0b0f3e1a	396f6c9c-ec69-4426-8a14-fdcc970c3dae
c2bfb9a9-5b17-46ef-98b2-07fc0eab30d6	74d2dc38-518a-4993-8610-97be0b0f3e1a	fd8083b8-8478-48da-901e-2e63ff1ac04e
124831c4-e56c-4b4b-92bf-3e757fcc7557	74d2dc38-518a-4993-8610-97be0b0f3e1a	84d6847a-1773-4714-82ae-ad68baa37f0a
f54b7076-50c7-4850-868c-f992ef8fecde	74d2dc38-518a-4993-8610-97be0b0f3e1a	41a06565-6005-445f-bf5c-89710ddba060
774cdf6b-96af-4762-8f36-2c31a9e286bf	74d2dc38-518a-4993-8610-97be0b0f3e1a	e269a9df-549c-4355-9d97-9d82e7b33531
744c7842-4505-445c-9aba-cbd145f4e03c	74d2dc38-518a-4993-8610-97be0b0f3e1a	c6cd62ef-690b-4afa-b98e-487f464cdae5
509308f8-a7a7-4d38-b85a-9c3dbd189cf0	74d2dc38-518a-4993-8610-97be0b0f3e1a	ec4b756a-7ebd-4d2b-9d55-88f467a6fbd8
0ea25543-4938-495a-9ddc-95b8e53ce7aa	74d2dc38-518a-4993-8610-97be0b0f3e1a	5ddf2e0f-9803-4e73-b2c0-48e924c8a57c
23ecdb92-13b2-47a8-a3d8-12c6eb945afd	74d2dc38-518a-4993-8610-97be0b0f3e1a	26e033b3-7763-48e9-a806-9601800650a4
d3c1e350-377e-4854-bf5c-ee7e6ac957a4	74d2dc38-518a-4993-8610-97be0b0f3e1a	12805322-9084-4f80-b643-0e187ba57bce
445d8fdf-c125-467c-ad48-05a8d53eca8d	74d2dc38-518a-4993-8610-97be0b0f3e1a	f134062e-41b5-4638-9f11-513b10c04c21
126461c1-2f99-4603-bf84-0ab52b845bd4	74d2dc38-518a-4993-8610-97be0b0f3e1a	fd317021-87c9-4b74-94bf-e193562183ee
dfa12e39-4846-4cd0-9e2e-6d27ad8c308f	74d2dc38-518a-4993-8610-97be0b0f3e1a	b9c92e9e-4924-406a-a4e4-98aa22a53468
44cccd76-be36-4281-9e75-8057123c561a	74d2dc38-518a-4993-8610-97be0b0f3e1a	816254d6-8700-420a-a74a-e7df7d7a9020
449299c6-70d8-4508-98cf-e655bbd73911	74d2dc38-518a-4993-8610-97be0b0f3e1a	f798416d-e359-4b7e-9593-e7f31ee88d34
65e7f9d3-1e74-4b1a-95fd-33c9f2649c70	74d2dc38-518a-4993-8610-97be0b0f3e1a	822d5352-c062-4bb5-a7b2-1698808521fc
2316cb4c-3b84-4b8f-8437-0748a1a08b00	74d2dc38-518a-4993-8610-97be0b0f3e1a	ee98488e-66de-4358-8039-49d460320183
996c0c9c-8ca3-4fa4-adbe-bfa1dad7ecee	74d2dc38-518a-4993-8610-97be0b0f3e1a	ef810363-a515-4554-8ffe-aa01e8e01a14
6bf7f9ba-c97b-44b2-b696-4b3116b7bdc7	74d2dc38-518a-4993-8610-97be0b0f3e1a	2dd01ce2-06f1-4e8d-8e9c-702b130c45cc
b3918c12-374d-441e-8f97-a85f18c6b4a9	74d2dc38-518a-4993-8610-97be0b0f3e1a	d89a1445-8cc6-445c-b62c-99e23da32dad
971a026a-45a2-46bc-8459-941669814f4b	74d2dc38-518a-4993-8610-97be0b0f3e1a	2e6c839d-0138-4463-b40c-8715b555af82
c4506c1d-b5fd-491c-a9e9-a7e7125b7b9f	74d2dc38-518a-4993-8610-97be0b0f3e1a	b2bd1d5f-9635-4002-9c7a-a8b2d9a3c9c4
01276992-6327-43ef-ae44-e66b3070449c	74d2dc38-518a-4993-8610-97be0b0f3e1a	ca3f881c-2fab-4873-85fb-f68528475657
687456c1-8c65-4297-807a-69538e4a8607	74d2dc38-518a-4993-8610-97be0b0f3e1a	03ce735e-647a-42a4-946a-cd5c56100f72
5cb69d2f-75fb-46e3-9179-8d0a0f469a58	74d2dc38-518a-4993-8610-97be0b0f3e1a	aced3581-ee8d-49f0-b36f-bba03a9aa51c
b7f0eef3-ed61-45b3-b6d0-c61d8bf81db5	74d2dc38-518a-4993-8610-97be0b0f3e1a	1081f804-b5fc-4a5a-b831-9b646c114b6f
44c2cd54-b1f8-430f-ae9c-dbef242904d5	74d2dc38-518a-4993-8610-97be0b0f3e1a	28dbd67b-416f-444b-8a26-f7128d276b60
7e0c783f-4323-4d95-816a-bb077846639f	74d2dc38-518a-4993-8610-97be0b0f3e1a	6d6095e9-a519-4a9b-920b-21ff1f3622d2
291939e8-959a-4305-86e6-2ee856166437	74d2dc38-518a-4993-8610-97be0b0f3e1a	cf8ea1c5-7088-46c4-bbe2-725e243422ca
0844b318-9715-4b6e-9c43-50ac70548b07	74d2dc38-518a-4993-8610-97be0b0f3e1a	cd33bac7-d5cf-4624-8084-d9315dbb8125
34b9fd57-c4ba-47e1-a16d-a55b79d0db49	74d2dc38-518a-4993-8610-97be0b0f3e1a	fc8f5791-6042-41ad-9bd8-3bca1610f48c
a0357b11-5eb7-4eab-9a32-419f73922060	74d2dc38-518a-4993-8610-97be0b0f3e1a	3c5bef21-55dd-4499-85ca-ed81da008a0f
86ff311e-44e8-4459-bdfa-f5af2e0c2281	74d2dc38-518a-4993-8610-97be0b0f3e1a	4f19eb0f-ec57-4c39-a5bf-9145b4d6d31c
2cf841a0-290f-4b96-b631-d8a10297849f	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	04ffb4bd-8d7f-4c6c-8db1-b3bb85c7e49a
33315152-551c-4b5c-8648-fb62eabf8f38	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	0ba0b273-3904-43c1-baba-214f3f9f9316
ea746cdf-25bc-4313-b6fd-9366a9864927	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	2dd01ce2-06f1-4e8d-8e9c-702b130c45cc
bc7633a4-cba0-4d01-97e0-755e32f91a3d	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	41a06565-6005-445f-bf5c-89710ddba060
a0de1670-2606-4ae6-be06-c524a5bbfa52	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	5ddf2e0f-9803-4e73-b2c0-48e924c8a57c
b9f64029-6120-4c39-a54d-222335791aba	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	816254d6-8700-420a-a74a-e7df7d7a9020
da335199-9f0d-4a39-a19a-ae5f849b1daa	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	822d5352-c062-4bb5-a7b2-1698808521fc
75300ff1-fb4b-49a6-8b55-0d2a1c67e3a9	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	84d6847a-1773-4714-82ae-ad68baa37f0a
faf89865-e750-4098-bc75-10f7166bc21f	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	92484a1d-4da6-451d-9c00-265a3d95aea4
34e2476f-93ce-48ed-8992-110ee7f1c8d6	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	a32837d3-d716-41ab-97f0-4e4b40aeb567
233a7b3c-2bc1-4e01-b69b-89858d7a5474	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	a7adb340-488b-4aa3-b496-9aea8b767a42
e869335f-ba75-4ccf-b395-33213690d0a3	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	a9f1c349-9295-4608-bb94-6120289d8dab
69a06bc6-cb9d-4d27-83b0-a4f1cf90c748	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	b210ddfc-347a-4350-a8bc-28ba6b3ad0b1
dc99700f-ec6a-431a-b92c-c532a667ee06	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	b9c92e9e-4924-406a-a4e4-98aa22a53468
d9d0b1d0-9dbd-480a-b053-c62cbf7a7835	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	c6cd62ef-690b-4afa-b98e-487f464cdae5
c9455d8c-0254-4054-88aa-972b1a765fd9	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	e0e1dfa5-c798-4fd7-932f-3e1dd91ae509
2a9ed7c7-5478-4508-b42d-40d8ecf6372d	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	ec4b756a-7ebd-4d2b-9d55-88f467a6fbd8
7b3e8781-7951-48d6-a61a-84073dd2d9b6	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	ef810363-a515-4554-8ffe-aa01e8e01a14
85d1cfd8-14c5-4329-9e30-00973911f8b8	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	facdb87c-245e-4412-8c10-254834123d4c
2e97831d-7250-4087-84d0-8ade6a4dde56	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	fd317021-87c9-4b74-94bf-e193562183ee
ecda83b7-b197-4f5d-a3b5-ebcaf95c9383	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	fd8083b8-8478-48da-901e-2e63ff1ac04e
681a4944-0eaa-459e-bdd9-3cfe5e51a571	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	b2bd1d5f-9635-4002-9c7a-a8b2d9a3c9c4
43bb53ac-6107-4bc2-acda-04a411cf8f37	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	ca3f881c-2fab-4873-85fb-f68528475657
afbc2c36-f2d9-4a73-aa9d-0cd683c3c2e9	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	03ce735e-647a-42a4-946a-cd5c56100f72
f64595ed-b041-4458-b996-12674fa410f0	e8af777f-1ebf-483c-a6ba-f6d96538f101	e0e1dfa5-c798-4fd7-932f-3e1dd91ae509
930cceae-9513-4403-a5b3-a7a284d4ad94	e8af777f-1ebf-483c-a6ba-f6d96538f101	04ffb4bd-8d7f-4c6c-8db1-b3bb85c7e49a
c3d07304-f615-48dd-a91a-b3fdb00f48d3	e8af777f-1ebf-483c-a6ba-f6d96538f101	a7adb340-488b-4aa3-b496-9aea8b767a42
388ae96d-17b8-48a4-85b3-4832df626a00	e8af777f-1ebf-483c-a6ba-f6d96538f101	a32837d3-d716-41ab-97f0-4e4b40aeb567
8fde522d-da72-436b-ad63-002bc512e128	e8af777f-1ebf-483c-a6ba-f6d96538f101	a9f1c349-9295-4608-bb94-6120289d8dab
0ed6c1e5-f4d5-4c7e-9f32-ebaf6eb38a6c	e8af777f-1ebf-483c-a6ba-f6d96538f101	facdb87c-245e-4412-8c10-254834123d4c
8ba94b07-3293-4814-be7e-40c10abed574	e8af777f-1ebf-483c-a6ba-f6d96538f101	7e15fa26-a803-4023-82ed-d32928d6fe5c
dfdba444-abbd-40b5-b56b-9c35ae01d77f	e8af777f-1ebf-483c-a6ba-f6d96538f101	41a06565-6005-445f-bf5c-89710ddba060
48eae9be-31e8-4f51-aa31-8b3107078d0f	e8af777f-1ebf-483c-a6ba-f6d96538f101	84d6847a-1773-4714-82ae-ad68baa37f0a
abb5d790-6a67-4fa6-8ad0-683efe88b7b6	e8af777f-1ebf-483c-a6ba-f6d96538f101	fd8083b8-8478-48da-901e-2e63ff1ac04e
4553edb8-34dd-420c-a12a-9d59a1145139	e8af777f-1ebf-483c-a6ba-f6d96538f101	5ddf2e0f-9803-4e73-b2c0-48e924c8a57c
4e0fc306-6ca8-4e43-b2fa-20c73e2e6d21	e8af777f-1ebf-483c-a6ba-f6d96538f101	c6cd62ef-690b-4afa-b98e-487f464cdae5
a0aa3eb3-f85c-40f7-87c9-881bf6bfb24f	e8af777f-1ebf-483c-a6ba-f6d96538f101	ec4b756a-7ebd-4d2b-9d55-88f467a6fbd8
76d974de-8666-4654-b89c-a7630d788134	e8af777f-1ebf-483c-a6ba-f6d96538f101	816254d6-8700-420a-a74a-e7df7d7a9020
c6db1574-756d-4fe7-af57-3eca9a6f869a	e8af777f-1ebf-483c-a6ba-f6d96538f101	b9c92e9e-4924-406a-a4e4-98aa22a53468
63c6d072-85b0-498c-ba75-f5b433ed6574	e8af777f-1ebf-483c-a6ba-f6d96538f101	fd317021-87c9-4b74-94bf-e193562183ee
77037c70-404d-44a5-ae69-7e2728c79a4e	e8af777f-1ebf-483c-a6ba-f6d96538f101	92484a1d-4da6-451d-9c00-265a3d95aea4
a32a9e01-2f17-464a-989e-6f43262615cc	e8af777f-1ebf-483c-a6ba-f6d96538f101	0ba0b273-3904-43c1-baba-214f3f9f9316
9d0b7b01-8742-40b6-b74b-3383d9df5b17	e8af777f-1ebf-483c-a6ba-f6d96538f101	b210ddfc-347a-4350-a8bc-28ba6b3ad0b1
e5eb09d4-1b28-4f1e-a58f-0650c17baba6	e8af777f-1ebf-483c-a6ba-f6d96538f101	822d5352-c062-4bb5-a7b2-1698808521fc
d445209c-4a93-4e2f-a6b9-d23be0d12cc5	e8af777f-1ebf-483c-a6ba-f6d96538f101	ef810363-a515-4554-8ffe-aa01e8e01a14
90330e7b-9461-4307-b968-f9fcefcbb9e3	e8af777f-1ebf-483c-a6ba-f6d96538f101	2dd01ce2-06f1-4e8d-8e9c-702b130c45cc
60775391-afa5-4d68-ba8d-72bc176b04ab	e8af777f-1ebf-483c-a6ba-f6d96538f101	d89a1445-8cc6-445c-b62c-99e23da32dad
4734836d-6066-4118-af0f-ad9f11e01507	e8af777f-1ebf-483c-a6ba-f6d96538f101	b2bd1d5f-9635-4002-9c7a-a8b2d9a3c9c4
3a870b7d-d0c1-42b7-add1-e11bb482f66f	e8af777f-1ebf-483c-a6ba-f6d96538f101	ca3f881c-2fab-4873-85fb-f68528475657
cbb276b5-316f-4596-966e-e7365ac6e8bc	e8af777f-1ebf-483c-a6ba-f6d96538f101	03ce735e-647a-42a4-946a-cd5c56100f72
\.


--
-- Data for Name: vendor_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendor_subscriptions (id, vendor_id, plan_id, start_date, end_date, status) FROM stdin;
\.


--
-- Data for Name: vendor_vehicle_models; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendor_vehicle_models (id, vendor_id, vehicle_model_id) FROM stdin;
1769262a-17da-4bb1-92af-2fcdeaa1db2a	784876c3-1fac-4aee-a85c-622d65f0bf47	f8d6769c-2864-4eef-b82f-c68a62eb1e1a
a25ac3fc-1f5f-4e42-80e7-6ec4b67a7066	784876c3-1fac-4aee-a85c-622d65f0bf47	ffc814d2-1db3-4701-b215-eb5629e247fb
1360d033-17f3-429f-b8bd-2eaab642c1dd	784876c3-1fac-4aee-a85c-622d65f0bf47	b022db16-1753-4570-9760-8f32f2bee1a0
d7715115-32d7-43a6-be76-295301a6921b	784876c3-1fac-4aee-a85c-622d65f0bf47	8950a3bf-bd2c-45fa-b2b7-c62dc81715a0
99dbcd0b-cf0b-44c0-95a1-7dbf2d1ae903	784876c3-1fac-4aee-a85c-622d65f0bf47	b9eab9e5-c3cf-42a7-8215-c0ac84687cb1
b16ee3a6-7e66-48be-89f1-10e31915c316	784876c3-1fac-4aee-a85c-622d65f0bf47	4bfb0763-947c-4336-8aa0-cbea6d44d07c
f14f3852-2eb8-426b-a683-1ee084762441	784876c3-1fac-4aee-a85c-622d65f0bf47	e136e1d1-bada-4397-b38e-3d4b0612e701
175e980f-303f-4f57-8e15-f7913a160455	784876c3-1fac-4aee-a85c-622d65f0bf47	efde7414-16d4-4ac3-9970-7d93ac76045b
41af1c0e-3a0d-45b4-80ce-1e98c46196b5	784876c3-1fac-4aee-a85c-622d65f0bf47	bb528b9c-0d2a-4fc8-8999-c99db58b7ab0
57f98e67-dba3-42ed-875b-b1ed63511403	784876c3-1fac-4aee-a85c-622d65f0bf47	733af90e-f6f1-46f7-bb3d-3e951e5fbf3c
9d8938f5-98c5-44e0-a938-2b80a7a8674e	784876c3-1fac-4aee-a85c-622d65f0bf47	e8abd400-64fd-4751-9a17-42e95536d408
1488df9c-5969-4222-9d01-6fa23ae04070	784876c3-1fac-4aee-a85c-622d65f0bf47	e3d38a1d-3487-4ba0-9afc-806927380547
880b7a57-2ed7-4d92-8f3e-3512a55af6df	784876c3-1fac-4aee-a85c-622d65f0bf47	7246ec87-fc53-4c26-aca4-f9a88f71b3ce
aff65edd-82de-40ef-ac38-ae92806d1f2f	784876c3-1fac-4aee-a85c-622d65f0bf47	2cad2486-4603-4b49-ab7a-f751461f8638
a69d4a8b-1ded-4357-883c-62c322b04f55	784876c3-1fac-4aee-a85c-622d65f0bf47	ea3a09d7-5684-42ec-8234-a0c49cd327f6
ce318ef9-4d0f-4e7d-bdf8-c5ff15ba9ea2	784876c3-1fac-4aee-a85c-622d65f0bf47	dc89d91d-205c-422a-a092-fed4e33ba124
b84cf5f1-7498-49dd-ab1d-fddf294063dd	784876c3-1fac-4aee-a85c-622d65f0bf47	be037d00-0cfd-4272-8230-ba8f70a01ab6
8365d728-af08-4a1a-be80-093ba7280862	784876c3-1fac-4aee-a85c-622d65f0bf47	3268e39c-6d9a-4833-964b-b6bba7fcc95e
5b852293-c456-40e2-9e2b-641c9adab4f2	9b28fc49-c10e-43ca-b940-7acd2d858bbc	f8d6769c-2864-4eef-b82f-c68a62eb1e1a
a3167561-33a1-460b-8eec-3e503af9aa06	9b28fc49-c10e-43ca-b940-7acd2d858bbc	c5362013-d69d-4afc-8ee7-5b1c14efb012
39a824a0-1e4f-43a9-862f-5e8c00986da8	9b28fc49-c10e-43ca-b940-7acd2d858bbc	4bfb0763-947c-4336-8aa0-cbea6d44d07c
c017371c-e4db-400e-b1e3-7a0555974227	9b28fc49-c10e-43ca-b940-7acd2d858bbc	c36ab7a9-2f99-41bd-a04c-fbdd5dc41cbd
497825d9-ab0f-46c6-aee7-80414d7beeea	9b28fc49-c10e-43ca-b940-7acd2d858bbc	2dd116bd-0c15-473b-a4ef-e314f3c8ca07
e24f1170-3bbb-4488-b9ea-f04e9c08e447	74d2dc38-518a-4993-8610-97be0b0f3e1a	f8d6769c-2864-4eef-b82f-c68a62eb1e1a
28bcfaa3-6e21-43b0-b9d6-1e8f77a67cce	74d2dc38-518a-4993-8610-97be0b0f3e1a	ffc814d2-1db3-4701-b215-eb5629e247fb
a5e3cb81-c7bf-455f-92ac-0d7829eb23cd	74d2dc38-518a-4993-8610-97be0b0f3e1a	8950a3bf-bd2c-45fa-b2b7-c62dc81715a0
45006c18-f9d0-4a92-918e-535da24de521	74d2dc38-518a-4993-8610-97be0b0f3e1a	b9eab9e5-c3cf-42a7-8215-c0ac84687cb1
6407af53-c37b-45be-ab4f-3bc044546f55	74d2dc38-518a-4993-8610-97be0b0f3e1a	b022db16-1753-4570-9760-8f32f2bee1a0
46816068-06b5-4b25-a46f-a9d816356dc6	74d2dc38-518a-4993-8610-97be0b0f3e1a	c5362013-d69d-4afc-8ee7-5b1c14efb012
7729d1d5-5e6a-4c01-a3a6-c0316acb601e	74d2dc38-518a-4993-8610-97be0b0f3e1a	fdfb9ef3-828f-4d59-ad44-3f7c2b13e57e
a99016db-b8f7-4ec3-b59a-a90baedd79b9	74d2dc38-518a-4993-8610-97be0b0f3e1a	4bfb0763-947c-4336-8aa0-cbea6d44d07c
690e410e-2156-4e9f-8da6-0dcb165bfd48	74d2dc38-518a-4993-8610-97be0b0f3e1a	14f9ee2b-b75a-44f0-abfb-c5831a8a0eee
ed85c3ec-7187-4501-aae2-ab0dc9255781	74d2dc38-518a-4993-8610-97be0b0f3e1a	8f32f290-717d-42fb-92f7-1f93f81d99f4
16979850-483f-408c-815e-0e00eb83f627	74d2dc38-518a-4993-8610-97be0b0f3e1a	e136e1d1-bada-4397-b38e-3d4b0612e701
57611c18-097a-4895-ac93-0d489ef375cb	74d2dc38-518a-4993-8610-97be0b0f3e1a	efde7414-16d4-4ac3-9970-7d93ac76045b
eb7577bd-80eb-4450-a5ff-e576ffd0922e	74d2dc38-518a-4993-8610-97be0b0f3e1a	bb528b9c-0d2a-4fc8-8999-c99db58b7ab0
ce186528-2747-477b-b706-efa09c6ac575	74d2dc38-518a-4993-8610-97be0b0f3e1a	94ed8e3c-b9e9-4a3e-9d3b-2d14b87c559b
13491625-5ad3-453d-84f7-3cb13a723719	74d2dc38-518a-4993-8610-97be0b0f3e1a	edd95e71-400c-4966-b120-dc85bb003093
fda34701-c02f-457d-a30b-9cc06ca4a1bf	74d2dc38-518a-4993-8610-97be0b0f3e1a	733af90e-f6f1-46f7-bb3d-3e951e5fbf3c
45191884-f7e3-4727-b448-79de378d8104	74d2dc38-518a-4993-8610-97be0b0f3e1a	e8abd400-64fd-4751-9a17-42e95536d408
3ae82905-a97c-40cf-aa37-a67445525162	74d2dc38-518a-4993-8610-97be0b0f3e1a	e3d38a1d-3487-4ba0-9afc-806927380547
76be4083-efd9-42ed-935f-96b0c0e757c4	74d2dc38-518a-4993-8610-97be0b0f3e1a	50535620-18d3-414d-811b-35f54f4b8d4f
985b8d12-a748-4fb5-b514-f5b4ce6fd71e	74d2dc38-518a-4993-8610-97be0b0f3e1a	0d285320-90a7-4ddb-b498-f728a6c0610b
27a62ca3-10c8-4a56-93ac-615efcffe17f	74d2dc38-518a-4993-8610-97be0b0f3e1a	7246ec87-fc53-4c26-aca4-f9a88f71b3ce
d3a833c8-877c-4fc7-a837-980ffb084c9b	74d2dc38-518a-4993-8610-97be0b0f3e1a	2cad2486-4603-4b49-ab7a-f751461f8638
61c67a68-72f0-4fad-873e-7c9177dc40a7	74d2dc38-518a-4993-8610-97be0b0f3e1a	32e4a2c6-0eeb-42c3-be0c-68645c30b348
2e9fe740-5d4e-435e-b256-3132cf9fdcb3	74d2dc38-518a-4993-8610-97be0b0f3e1a	85e84938-7755-43a0-91e5-eceb350364e0
6e93182c-2afd-487e-b55d-210668e70b3b	74d2dc38-518a-4993-8610-97be0b0f3e1a	ea3a09d7-5684-42ec-8234-a0c49cd327f6
8a8ba69e-88e2-4986-b880-394f0056e922	74d2dc38-518a-4993-8610-97be0b0f3e1a	207f6dc1-3816-49ee-b12b-161515ddc653
e7b7f5ab-8850-4f22-9691-e575d2d573b6	74d2dc38-518a-4993-8610-97be0b0f3e1a	15b70ef2-7035-48ef-9ca0-6c02b832499f
0452f3e5-55f4-4859-be51-c688aaae7b9d	74d2dc38-518a-4993-8610-97be0b0f3e1a	3268e39c-6d9a-4833-964b-b6bba7fcc95e
1b4fa059-520b-4a2d-8756-bba05d2f039e	74d2dc38-518a-4993-8610-97be0b0f3e1a	be037d00-0cfd-4272-8230-ba8f70a01ab6
752b546c-14f0-4062-a1f1-849748b94185	74d2dc38-518a-4993-8610-97be0b0f3e1a	dc89d91d-205c-422a-a092-fed4e33ba124
ad9fcaa3-2fb9-49a2-8433-f7502dee6986	74d2dc38-518a-4993-8610-97be0b0f3e1a	b8e12448-9480-41b9-a9e4-e835fa1ab2e2
84740fae-a404-43b7-ab2b-5e05118b3774	74d2dc38-518a-4993-8610-97be0b0f3e1a	47513cf1-acd9-4d88-b935-d0d0f123ef92
7c4527c6-ebf5-428c-91b3-61121f4f09e4	74d2dc38-518a-4993-8610-97be0b0f3e1a	db57e161-8244-4fbf-8889-90c7c9932985
a52f8a30-54e0-42ac-877e-2a4f5c8179ac	74d2dc38-518a-4993-8610-97be0b0f3e1a	ef674851-46b3-4c89-9fae-abaa95d9fe99
c1a1412b-2835-4d9f-87ae-5abd493b7479	74d2dc38-518a-4993-8610-97be0b0f3e1a	aa7d2cd4-7623-4d7a-bebb-b4de3b5527f4
cd7b55f1-6f2a-424c-99ad-daa55702446b	74d2dc38-518a-4993-8610-97be0b0f3e1a	c36ab7a9-2f99-41bd-a04c-fbdd5dc41cbd
e9ef7db5-fd6d-4371-ac4a-ed31c4f889f3	74d2dc38-518a-4993-8610-97be0b0f3e1a	113189e5-6064-4de5-8f07-66f43b7b82dd
13e21539-e854-4530-87d4-67e26932bdfb	74d2dc38-518a-4993-8610-97be0b0f3e1a	d0f805f0-4e96-4db3-86dc-0ab92b298bb2
8c857ec2-d64d-42e3-aefc-5c8b5560e1fb	74d2dc38-518a-4993-8610-97be0b0f3e1a	75c618fe-f940-4b18-938d-76be21c588a2
73879e62-3e3d-49c1-9367-a5d346473216	74d2dc38-518a-4993-8610-97be0b0f3e1a	ed795af2-6985-4d88-9196-bf498d396a9c
524dae88-d767-45a2-9a80-77be14cb9802	74d2dc38-518a-4993-8610-97be0b0f3e1a	2dd116bd-0c15-473b-a4ef-e314f3c8ca07
2783ddc4-80df-4210-8946-135507b5569a	74d2dc38-518a-4993-8610-97be0b0f3e1a	ab7f9a63-ea44-46bf-8109-74760268252f
39745431-8cef-4249-bf9a-ae2d2d61cb3d	74d2dc38-518a-4993-8610-97be0b0f3e1a	c03676d3-e2b7-417c-98ab-5c2de91b6ad9
be76e65f-362e-495d-a282-bed7de259e66	74d2dc38-518a-4993-8610-97be0b0f3e1a	8780f38d-a310-457f-998c-5564d6ba075b
cacf80a4-df60-41a9-bcdc-1d67bcc525cd	74d2dc38-518a-4993-8610-97be0b0f3e1a	5f312c50-0371-4d67-b81b-bc850b049aad
af71093c-eada-4ee5-ace8-a4693ae57f3f	74d2dc38-518a-4993-8610-97be0b0f3e1a	2a88029e-3fa3-455f-8f3b-d8db3c2e6f2d
479def06-8335-4452-b62b-75891d20ded6	74d2dc38-518a-4993-8610-97be0b0f3e1a	4dbc65f5-072a-4818-aced-4482cf9686c0
249adf0d-4d25-4b63-b05f-dd325a1aa0c8	74d2dc38-518a-4993-8610-97be0b0f3e1a	750a0fbb-ef7a-49d8-b9c3-09d01a95d1f9
d890b679-8354-4527-a66e-1ba9a7aaedc0	74d2dc38-518a-4993-8610-97be0b0f3e1a	6da92098-f6c6-41ab-9c1c-055b8d6a5c14
d85da8e5-7a02-4c41-9655-2a14ffc0ac9e	74d2dc38-518a-4993-8610-97be0b0f3e1a	41055ea6-e2b1-4ed0-83b1-89499755b487
8bf9fd14-5451-4bb6-af5b-d66eaeb10d0a	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	f8d6769c-2864-4eef-b82f-c68a62eb1e1a
29bb49ae-83f8-49a8-b9cd-2e0c14933466	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	ffc814d2-1db3-4701-b215-eb5629e247fb
d6f217e9-c9d0-4bca-9c38-8c17e4e0c3b5	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	b022db16-1753-4570-9760-8f32f2bee1a0
e8fd123a-5f50-4dcd-b358-54f6f37d4f21	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	8950a3bf-bd2c-45fa-b2b7-c62dc81715a0
7c37fcf7-8c24-4996-a879-69dce09847e9	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	b9eab9e5-c3cf-42a7-8215-c0ac84687cb1
5725f837-7ed8-4231-8491-a4b1008595a4	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	4bfb0763-947c-4336-8aa0-cbea6d44d07c
874746ea-7093-4c8e-b251-3d5f7fa4a001	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	e136e1d1-bada-4397-b38e-3d4b0612e701
e61ea1ff-d3c2-47b5-a54c-c4989c2bb1e5	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	efde7414-16d4-4ac3-9970-7d93ac76045b
90c903b8-8631-4f04-8916-a5895e73b60b	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	bb528b9c-0d2a-4fc8-8999-c99db58b7ab0
b3de251b-69d2-4fb3-b117-4e6513b32b1c	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	733af90e-f6f1-46f7-bb3d-3e951e5fbf3c
096430a1-2994-49fe-ba26-10946f076af3	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	e8abd400-64fd-4751-9a17-42e95536d408
df97e86b-f2e5-4377-b234-cdef84348501	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	e3d38a1d-3487-4ba0-9afc-806927380547
2491e38c-793a-40ea-a8c5-ff461d66e1f1	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	2dd116bd-0c15-473b-a4ef-e314f3c8ca07
2623c94a-20d4-4220-a74c-410f96160240	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	2a88029e-3fa3-455f-8f3b-d8db3c2e6f2d
c0fd708f-4b31-48bc-9367-486913991771	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	4dbc65f5-072a-4818-aced-4482cf9686c0
e120314f-783c-4965-97e3-cd58ed528ae8	aa759d2c-24b6-495b-bd34-d793e1d3e4a9	750a0fbb-ef7a-49d8-b9c3-09d01a95d1f9
63c074f0-8bcb-4cc6-a013-243a93ff6bc2	e8af777f-1ebf-483c-a6ba-f6d96538f101	f8d6769c-2864-4eef-b82f-c68a62eb1e1a
f7c2828d-ae80-476b-9675-ae4db223d9b8	e8af777f-1ebf-483c-a6ba-f6d96538f101	ffc814d2-1db3-4701-b215-eb5629e247fb
abed1d48-46bf-477d-a4ad-2244df041f7e	e8af777f-1ebf-483c-a6ba-f6d96538f101	b022db16-1753-4570-9760-8f32f2bee1a0
9e9f414a-3d29-4024-b822-d665fe10e0ff	e8af777f-1ebf-483c-a6ba-f6d96538f101	fdfb9ef3-828f-4d59-ad44-3f7c2b13e57e
9b32fc40-a757-401b-9253-e54d140218e9	e8af777f-1ebf-483c-a6ba-f6d96538f101	8950a3bf-bd2c-45fa-b2b7-c62dc81715a0
eca098f1-ece9-4ae7-a31f-57847b45ae59	e8af777f-1ebf-483c-a6ba-f6d96538f101	b9eab9e5-c3cf-42a7-8215-c0ac84687cb1
5bc18e0e-f8a0-4b27-b954-c62f0df1fe75	e8af777f-1ebf-483c-a6ba-f6d96538f101	4bfb0763-947c-4336-8aa0-cbea6d44d07c
76149bdd-cace-4a29-b8e1-95a0141e5edf	e8af777f-1ebf-483c-a6ba-f6d96538f101	14f9ee2b-b75a-44f0-abfb-c5831a8a0eee
55ed731d-48e8-4c34-9307-90ceef5f63eb	e8af777f-1ebf-483c-a6ba-f6d96538f101	e136e1d1-bada-4397-b38e-3d4b0612e701
c5f1d761-d79e-45c1-937e-9d91947e2c98	e8af777f-1ebf-483c-a6ba-f6d96538f101	efde7414-16d4-4ac3-9970-7d93ac76045b
e409f152-8edb-4e67-8c6f-60b5f737535c	e8af777f-1ebf-483c-a6ba-f6d96538f101	bb528b9c-0d2a-4fc8-8999-c99db58b7ab0
07de8227-11bf-427a-80dd-95734f76777e	e8af777f-1ebf-483c-a6ba-f6d96538f101	edd95e71-400c-4966-b120-dc85bb003093
23fed195-40e9-412b-a620-ab747f837da7	e8af777f-1ebf-483c-a6ba-f6d96538f101	e8abd400-64fd-4751-9a17-42e95536d408
e2d15e02-7229-4e9f-80b9-98c55963339e	e8af777f-1ebf-483c-a6ba-f6d96538f101	e3d38a1d-3487-4ba0-9afc-806927380547
474d3934-c7b1-47bc-b7e4-0734be200e1b	e8af777f-1ebf-483c-a6ba-f6d96538f101	50535620-18d3-414d-811b-35f54f4b8d4f
21c56aca-4ec9-4a96-ae33-aa78f1616716	e8af777f-1ebf-483c-a6ba-f6d96538f101	733af90e-f6f1-46f7-bb3d-3e951e5fbf3c
\.


--
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendors (id, user_id, business_name, rif, logo_url, document_image_url, is_available, created_at, updated_at, city, country, full_address, latitude, longitude, municipality, parish, postal_code, reference_point, state, street) FROM stdin;
784876c3-1fac-4aee-a85c-622d65f0bf47	2da7b616-4b2e-44db-9704-ddff2bfe8e4d	Eliezer Parts	77657888	37513/public/uploads/1776791142507-logo.jpg	37513/uploads/1776791141556-doc_id.jpg	t	2026-04-21 17:05:41.333	2026-04-21 17:13:48.098	\N	Venezuela	Parroquia Luis Hurtado Higuera, Municipio Maracaibo, Zulia, Venezuela	10.587876	-71.6560904	Municipio Maracaibo	Parroquia Luis Hurtado Higuera	4004	Sede de Repuestos Online 	Zulia	\N
aa759d2c-24b6-495b-bd34-d793e1d3e4a9	892c5e81-8af4-425e-856f-d1a0e826f892	Elian Auto Parts	0876432667	37513/public/uploads/1776791812596-logo.jpg	37513/uploads/1776791810787-doc_id.jpg	t	2026-04-21 17:16:50.534	2026-04-21 17:16:53.514	\N	Venezuela	Parroquia Luis Hurtado Higuera, Municipio Maracaibo, Zulia, Venezuela	10.5879127	-71.6561123	Municipio Maracaibo	Parroquia Luis Hurtado Higuera	4004	Edificio los Robles 	Zulia	\N
9b28fc49-c10e-43ca-b940-7acd2d858bbc	604e58ec-58d4-4fc0-b367-9886d6ee2e26	Jesus Import, C.A.	J-99999999	37513/public/uploads/1776793290550-logo.jpg	37513/uploads/1776793288551-doc_id.jpg	t	2026-04-21 17:41:28.33	2026-04-21 17:41:31.612	\N	Venezuela	Calle 78 Doctor Portillo, Parroquia Bolívar, Municipio Maracaibo, Estado Zulia, Venezuela	10.66332447457839	-71.61812611494493	Municipio Maracaibo	Parroquia Bolívar	0261	Diagonal a dala	Estado Zulia	Calle 78 Doctor Portillo
74d2dc38-518a-4993-8610-97be0b0f3e1a	51037da5-29dc-4684-ad0f-a460352261ec	Pedro Car	J56928875	37513/public/uploads/1776798177372-logo.jpg	37513/uploads/1776798175977-doc_id.jpg	t	2026-04-21 19:02:55.625	2026-04-21 19:02:58.157	\N	Venezuela	Parroquia Luis Hurtado Higuera, Municipio Maracaibo, Zulia, Venezuela	10.5878498	-71.6560621	Municipio Maracaibo	Parroquia Luis Hurtado Higuera	4004	Repuestosonline 	Zulia	\N
e8af777f-1ebf-483c-a6ba-f6d96538f101	804b2420-2e52-4ab4-834d-5132029a20d0	Textiven	0872526w8w8q	37513/public/uploads/1776812898651-logo.jpg	37513/uploads/1776812897024-doc_id.jpg	t	2026-04-21 23:08:16.739	2026-04-21 23:08:19.643	San Francisco	Venezuela	La Coromoto, Parroquia San Francisco, Municipio San Francisco, San Francisco, Zulia, Venezuela	10.574342	-71.6374112	Municipio San Francisco	Parroquia San Francisco	4004	\N	Zulia	La Coromoto
\.


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chats chats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (id);


--
-- Name: email_verification_tokens email_verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: municipalities municipalities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.municipalities
    ADD CONSTRAINT municipalities_pkey PRIMARY KEY (id);


--
-- Name: part_categories part_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.part_categories
    ADD CONSTRAINT part_categories_pkey PRIMARY KEY (id);


--
-- Name: part_subcategories part_subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.part_subcategories
    ADD CONSTRAINT part_subcategories_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: request_ratings request_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_ratings
    ADD CONSTRAINT request_ratings_pkey PRIMARY KEY (id);


--
-- Name: request_responses request_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_responses
    ADD CONSTRAINT request_responses_pkey PRIMARY KEY (id);


--
-- Name: request_vendor_matches request_vendor_matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_vendor_matches
    ADD CONSTRAINT request_vendor_matches_pkey PRIMARY KEY (id);


--
-- Name: requests requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: states states_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.states
    ADD CONSTRAINT states_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vehicle_brands vehicle_brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_brands
    ADD CONSTRAINT vehicle_brands_pkey PRIMARY KEY (id);


--
-- Name: vehicle_models vehicle_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_models
    ADD CONSTRAINT vehicle_models_pkey PRIMARY KEY (id);


--
-- Name: vendor_metrics vendor_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_metrics
    ADD CONSTRAINT vendor_metrics_pkey PRIMARY KEY (id);


--
-- Name: vendor_part_subcategories vendor_part_subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_part_subcategories
    ADD CONSTRAINT vendor_part_subcategories_pkey PRIMARY KEY (id);


--
-- Name: vendor_subscriptions vendor_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_subscriptions
    ADD CONSTRAINT vendor_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: vendor_vehicle_models vendor_vehicle_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_vehicle_models
    ADD CONSTRAINT vendor_vehicle_models_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: chat_messages_chat_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_messages_chat_id_created_at_idx ON public.chat_messages USING btree (chat_id, created_at);


--
-- Name: chats_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chats_client_id_idx ON public.chats USING btree (client_id);


--
-- Name: chats_request_id_vendor_id_client_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX chats_request_id_vendor_id_client_id_key ON public.chats USING btree (request_id, vendor_id, client_id);


--
-- Name: chats_vendor_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chats_vendor_id_idx ON public.chats USING btree (vendor_id);


--
-- Name: email_verification_tokens_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX email_verification_tokens_token_key ON public.email_verification_tokens USING btree (token);


--
-- Name: municipalities_state_id_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX municipalities_state_id_name_key ON public.municipalities USING btree (state_id, name);


--
-- Name: part_categories_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX part_categories_name_key ON public.part_categories USING btree (name);


--
-- Name: part_subcategories_category_id_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX part_subcategories_category_id_name_key ON public.part_subcategories USING btree (category_id, name);


--
-- Name: password_reset_tokens_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX password_reset_tokens_token_key ON public.password_reset_tokens USING btree (token);


--
-- Name: request_ratings_request_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX request_ratings_request_id_key ON public.request_ratings USING btree (request_id);


--
-- Name: request_ratings_vendor_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX request_ratings_vendor_id_idx ON public.request_ratings USING btree (vendor_id);


--
-- Name: request_responses_request_id_vendor_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX request_responses_request_id_vendor_id_key ON public.request_responses USING btree (request_id, vendor_id);


--
-- Name: request_vendor_matches_request_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX request_vendor_matches_request_id_idx ON public.request_vendor_matches USING btree (request_id);


--
-- Name: request_vendor_matches_request_id_vendor_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX request_vendor_matches_request_id_vendor_id_key ON public.request_vendor_matches USING btree (request_id, vendor_id);


--
-- Name: request_vendor_matches_vendor_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX request_vendor_matches_vendor_id_idx ON public.request_vendor_matches USING btree (vendor_id);


--
-- Name: requests_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX requests_client_id_idx ON public.requests USING btree (client_id);


--
-- Name: requests_state_id_municipality_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX requests_state_id_municipality_id_idx ON public.requests USING btree (state_id, municipality_id);


--
-- Name: requests_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX requests_status_idx ON public.requests USING btree (status);


--
-- Name: roles_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);


--
-- Name: states_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX states_name_key ON public.states USING btree (name);


--
-- Name: user_roles_user_id_role_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_roles_user_id_role_id_key ON public.user_roles USING btree (user_id, role_id);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: vehicle_brands_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX vehicle_brands_name_key ON public.vehicle_brands USING btree (name);


--
-- Name: vehicle_models_brand_id_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX vehicle_models_brand_id_name_key ON public.vehicle_models USING btree (brand_id, name);


--
-- Name: vendor_metrics_vendor_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX vendor_metrics_vendor_id_key ON public.vendor_metrics USING btree (vendor_id);


--
-- Name: vendor_part_subcategories_vendor_id_part_subcategory_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX vendor_part_subcategories_vendor_id_part_subcategory_id_key ON public.vendor_part_subcategories USING btree (vendor_id, part_subcategory_id);


--
-- Name: vendor_vehicle_models_vendor_id_vehicle_model_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX vendor_vehicle_models_vendor_id_vehicle_model_id_key ON public.vendor_vehicle_models USING btree (vendor_id, vehicle_model_id);


--
-- Name: vendors_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX vendors_user_id_key ON public.vendors USING btree (user_id);


--
-- Name: chat_messages chat_messages_chat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: chats chats_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: chats chats_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: chats chats_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: email_verification_tokens email_verification_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: files files_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: municipalities municipalities_state_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.municipalities
    ADD CONSTRAINT municipalities_state_id_fkey FOREIGN KEY (state_id) REFERENCES public.states(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: part_subcategories part_subcategories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.part_subcategories
    ADD CONSTRAINT part_subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.part_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: request_ratings request_ratings_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_ratings
    ADD CONSTRAINT request_ratings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: request_ratings request_ratings_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_ratings
    ADD CONSTRAINT request_ratings_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: request_ratings request_ratings_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_ratings
    ADD CONSTRAINT request_ratings_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: request_responses request_responses_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_responses
    ADD CONSTRAINT request_responses_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: request_responses request_responses_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_responses
    ADD CONSTRAINT request_responses_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: request_vendor_matches request_vendor_matches_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_vendor_matches
    ADD CONSTRAINT request_vendor_matches_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: request_vendor_matches request_vendor_matches_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_vendor_matches
    ADD CONSTRAINT request_vendor_matches_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: requests requests_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: requests requests_municipality_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_municipality_id_fkey FOREIGN KEY (municipality_id) REFERENCES public.municipalities(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: requests requests_part_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_part_category_id_fkey FOREIGN KEY (part_category_id) REFERENCES public.part_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: requests requests_part_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_part_subcategory_id_fkey FOREIGN KEY (part_subcategory_id) REFERENCES public.part_subcategories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: requests requests_state_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_state_id_fkey FOREIGN KEY (state_id) REFERENCES public.states(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: requests requests_vehicle_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_vehicle_brand_id_fkey FOREIGN KEY (vehicle_brand_id) REFERENCES public.vehicle_brands(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: requests requests_vehicle_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_vehicle_model_id_fkey FOREIGN KEY (vehicle_model_id) REFERENCES public.vehicle_models(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: vehicle_models vehicle_models_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_models
    ADD CONSTRAINT vehicle_models_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.vehicle_brands(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: vendor_metrics vendor_metrics_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_metrics
    ADD CONSTRAINT vendor_metrics_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: vendor_part_subcategories vendor_part_subcategories_part_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_part_subcategories
    ADD CONSTRAINT vendor_part_subcategories_part_subcategory_id_fkey FOREIGN KEY (part_subcategory_id) REFERENCES public.part_subcategories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: vendor_part_subcategories vendor_part_subcategories_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_part_subcategories
    ADD CONSTRAINT vendor_part_subcategories_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vendor_subscriptions vendor_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_subscriptions
    ADD CONSTRAINT vendor_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: vendor_subscriptions vendor_subscriptions_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_subscriptions
    ADD CONSTRAINT vendor_subscriptions_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: vendor_vehicle_models vendor_vehicle_models_vehicle_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_vehicle_models
    ADD CONSTRAINT vendor_vehicle_models_vehicle_model_id_fkey FOREIGN KEY (vehicle_model_id) REFERENCES public.vehicle_models(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: vendor_vehicle_models vendor_vehicle_models_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_vehicle_models
    ADD CONSTRAINT vendor_vehicle_models_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vendors vendors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict PzYbY93iCO0wrBJmdoEiQk2enlM4ZWftXsx1TkEjx3qQ7Kz9T2eROBzCCTHjmgC

