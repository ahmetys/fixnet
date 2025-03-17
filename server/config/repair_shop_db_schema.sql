-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Anamakine: 127.0.0.1
-- Üretim Zamanı: 16 Mar 2025, 01:41:02
-- Sunucu sürümü: 10.4.32-MariaDB
-- PHP Sürümü: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Veritabanı: `repair_shop_db`
--

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `customers`
--

CREATE TABLE `customers` (
  `customer_id` int(11) NOT NULL,
  `customer_type` enum('commercial','individual') NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `customer_company` varchar(255) DEFAULT NULL,
  `customer_phone` varchar(20) NOT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  `customer_address` text DEFAULT NULL,
  `customer_notification` enum('sms','call','email','whatsapp') DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `device_brands`
--

CREATE TABLE `device_brands` (
  `device_brand_id` int(11) NOT NULL,
  `device_brand_name` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `device_brands`
--

INSERT INTO `device_brands` (`device_brand_id`, `device_brand_name`, `created_at`, `updated_at`) VALUES
(1, 'Apple', '2025-03-16 01:01:22', '2025-03-16 01:01:22'),
(2, 'Samsung', '2025-03-16 01:01:28', '2025-03-16 01:01:28'),
(3, 'Huawei', '2025-03-16 01:01:44', '2025-03-16 01:01:44'),
(4, 'Xiaomi', '2025-03-16 01:01:50', '2025-03-16 01:01:50'),
(5, 'Google', '2025-03-16 01:01:55', '2025-03-16 01:01:55'),
(6, 'Oppo', '2025-03-16 01:02:06', '2025-03-16 01:02:06'),
(7, 'OnePlus', '2025-03-16 01:02:24', '2025-03-16 01:02:24'),
(8, 'Sony', '2025-03-16 01:02:30', '2025-03-16 01:02:30'),
(9, 'Nintendo', '2025-03-16 01:15:18', '2025-03-16 01:15:18');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `device_models`
--

CREATE TABLE `device_models` (
  `device_model_id` int(11) NOT NULL,
  `device_model_name` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `device_type_id` int(11) DEFAULT NULL,
  `device_brand_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `device_models`
--

INSERT INTO `device_models` (`device_model_id`, `device_model_name`, `created_at`, `updated_at`, `device_type_id`, `device_brand_id`) VALUES
(1, 'iPhone 16 Pro Max', '2025-03-16 01:16:24', '2025-03-16 01:16:24', 1, 1),
(2, 'iPhone 16 Pro', '2025-03-16 01:16:30', '2025-03-16 01:16:30', 1, 1),
(3, 'iPhone 16 Plus', '2025-03-16 01:16:34', '2025-03-16 01:16:34', 1, 1),
(4, 'iPhone 16', '2025-03-16 01:16:39', '2025-03-16 01:16:39', 1, 1),
(5, 'iPhone 16e', '2025-03-16 01:16:44', '2025-03-16 01:16:44', 1, 1),
(6, 'iPhone 15 Pro Max', '2025-03-16 01:16:53', '2025-03-16 01:16:53', 1, 1),
(7, 'iPhone 15 Pro', '2025-03-16 01:16:57', '2025-03-16 01:16:57', 1, 1),
(8, 'iPhone 15 Plus', '2025-03-16 01:17:04', '2025-03-16 01:17:04', 1, 1),
(9, 'iPhone 15', '2025-03-16 01:17:09', '2025-03-16 01:17:09', 1, 1),
(10, 'iPhone 14 Pro Max', '2025-03-16 01:17:18', '2025-03-16 01:17:18', 1, 1),
(11, 'iPhone 14 Pro', '2025-03-16 01:17:22', '2025-03-16 01:17:22', 1, 1),
(12, 'iPhone 14 Plus', '2025-03-16 01:17:28', '2025-03-16 01:17:28', 1, 1),
(13, 'iPhone 14', '2025-03-16 01:17:33', '2025-03-16 01:17:33', 1, 1),
(14, 'iPhone 13 Pro Max', '2025-03-16 01:17:43', '2025-03-16 01:17:43', 1, 1),
(15, 'iPhone 13 Pro', '2025-03-16 01:17:47', '2025-03-16 01:17:47', 1, 1),
(16, 'iPhone 13 Mini', '2025-03-16 01:17:54', '2025-03-16 01:17:54', 1, 1),
(17, 'iPhone 13', '2025-03-16 01:17:59', '2025-03-16 01:17:59', 1, 1),
(18, 'iPhone 12 Pro Max', '2025-03-16 01:18:08', '2025-03-16 01:18:08', 1, 1),
(19, 'iPhone 12 Pro', '2025-03-16 01:18:14', '2025-03-16 01:18:14', 1, 1),
(20, 'iPhone 12 Mini', '2025-03-16 01:18:20', '2025-03-16 01:18:20', 1, 1),
(21, 'iPhone 12', '2025-03-16 01:18:27', '2025-03-16 01:18:27', 1, 1),
(22, 'iPhone 11 Pro Max', '2025-03-16 01:18:36', '2025-03-16 01:18:36', 1, 1),
(23, 'iPhone 11 Pro', '2025-03-16 01:18:40', '2025-03-16 01:18:40', 1, 1),
(24, 'iPhone 11', '2025-03-16 01:18:44', '2025-03-16 01:18:44', 1, 1),
(25, 'iPhone XS Max', '2025-03-16 01:18:54', '2025-03-16 01:18:54', 1, 1),
(26, 'iPhone XS', '2025-03-16 01:18:59', '2025-03-16 01:18:59', 1, 1),
(27, 'iPhone XR', '2025-03-16 01:19:04', '2025-03-16 01:19:04', 1, 1),
(28, 'iPhone X', '2025-03-16 01:19:09', '2025-03-16 01:19:09', 1, 1),
(29, 'iPhone SE 2022', '2025-03-16 01:19:24', '2025-03-16 01:19:24', 1, 1),
(30, 'iPhone SE 2020', '2025-03-16 01:19:30', '2025-03-16 01:19:30', 1, 1),
(31, 'iPhone SE 2016', '2025-03-16 01:19:36', '2025-03-16 01:19:36', 1, 1),
(32, 'iPhone 8 Plus', '2025-03-16 01:19:47', '2025-03-16 01:19:47', 1, 1),
(33, 'iPhone 8', '2025-03-16 01:19:51', '2025-03-16 01:19:51', 1, 1),
(34, 'iPhone 7 Plus', '2025-03-16 01:19:55', '2025-03-16 01:19:55', 1, 1),
(35, 'iPhone 7', '2025-03-16 01:20:00', '2025-03-16 01:20:00', 1, 1),
(36, 'iPhone 6S Plus', '2025-03-16 01:20:07', '2025-03-16 01:20:07', 1, 1),
(37, 'iPhone 6S', '2025-03-16 01:20:13', '2025-03-16 01:20:13', 1, 1),
(38, 'iPhone 6 Plus', '2025-03-16 01:20:18', '2025-03-16 01:20:18', 1, 1),
(39, 'iPhone 6', '2025-03-16 01:20:22', '2025-03-16 01:20:22', 1, 1),
(40, 'iPhone 5S', '2025-03-16 01:20:28', '2025-03-16 01:20:28', 1, 1),
(41, 'iPhone 5', '2025-03-16 01:20:34', '2025-03-16 01:20:34', 1, 1);

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `device_types`
--

CREATE TABLE `device_types` (
  `device_type_id` int(11) NOT NULL,
  `device_type_name` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `device_brand_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `device_types`
--

INSERT INTO `device_types` (`device_type_id`, `device_type_name`, `created_at`, `updated_at`, `device_brand_id`) VALUES
(1, 'iPhone', '2025-03-16 01:03:15', '2025-03-16 01:03:15', 1),
(2, 'iPad', '2025-03-16 01:03:20', '2025-03-16 01:03:20', 1),
(3, 'MacBook', '2025-03-16 01:03:29', '2025-03-16 01:03:29', 1),
(4, 'Watch', '2025-03-16 01:03:34', '2025-03-16 01:03:34', 1),
(5, 'S Series', '2025-03-16 01:03:59', '2025-03-16 01:04:06', 2),
(6, 'A Series', '2025-03-16 01:04:11', '2025-03-16 01:04:11', 2),
(7, 'Z Series', '2025-03-16 01:04:33', '2025-03-16 01:04:33', 2),
(8, 'M Series', '2025-03-16 01:04:40', '2025-03-16 01:04:40', 2),
(9, 'J Series', '2025-03-16 01:04:48', '2025-03-16 01:04:48', 2),
(10, 'Note Series', '2025-03-16 01:04:55', '2025-03-16 01:04:55', 2),
(11, 'XCover Series', '2025-03-16 01:05:28', '2025-03-16 01:05:28', 2),
(12, 'Tab Series', '2025-03-16 01:06:24', '2025-03-16 01:06:24', 2),
(13, 'P Series', '2025-03-16 01:07:01', '2025-03-16 01:07:01', 3),
(14, 'Y Series', '2025-03-16 01:07:13', '2025-03-16 01:07:13', 3),
(15, 'Mate Series', '2025-03-16 01:07:20', '2025-03-16 01:07:20', 3),
(16, 'Honor', '2025-03-16 01:07:27', '2025-03-16 01:07:27', 3),
(17, 'Nova', '2025-03-16 01:07:31', '2025-03-16 01:07:31', 3),
(18, 'Huawei Tab', '2025-03-16 01:07:50', '2025-03-16 01:07:50', 3),
(19, 'Redmi', '2025-03-16 01:08:30', '2025-03-16 01:08:30', 4),
(20, 'Redmi Note', '2025-03-16 01:08:35', '2025-03-16 01:08:35', 4),
(21, 'Mi', '2025-03-16 01:08:39', '2025-03-16 01:08:39', 4),
(22, 'Mi Note', '2025-03-16 01:08:44', '2025-03-16 01:08:44', 4),
(23, 'Poco', '2025-03-16 01:09:52', '2025-03-16 01:09:52', 4),
(24, 'Xiaomi Tab', '2025-03-16 01:10:03', '2025-03-16 01:10:03', 4),
(25, 'Pixel', '2025-03-16 01:10:31', '2025-03-16 01:10:31', 5),
(27, 'F Series', '2025-03-16 01:11:57', '2025-03-16 01:11:57', 6),
(28, 'A Series(Oppo)', '2025-03-16 01:12:06', '2025-03-16 01:12:06', 6),
(29, 'R Series', '2025-03-16 01:12:22', '2025-03-16 01:12:22', 6),
(30, 'Find Series', '2025-03-16 01:12:30', '2025-03-16 01:12:30', 6),
(31, 'Reno Series', '2025-03-16 01:12:35', '2025-03-16 01:12:35', 6),
(32, 'All', '2025-03-16 01:13:24', '2025-03-16 01:14:09', 7),
(33, 'PlayStation', '2025-03-16 01:15:06', '2025-03-16 01:15:06', 8),
(34, 'Switch', '2025-03-16 01:15:25', '2025-03-16 01:15:25', 9);

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `operations`
--

CREATE TABLE `operations` (
  `operation_id` int(11) NOT NULL,
  `operation_name` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `operations`
--

INSERT INTO `operations` (`operation_id`, `operation_name`, `created_at`, `updated_at`) VALUES
(1, 'Fehlerdiagnose', '2025-03-16 01:30:01', '2025-03-16 01:30:01'),
(2, 'Display-Austausch', '2025-03-16 01:32:44', '2025-03-16 01:32:44'),
(3, 'Akku-Austausch', '2025-03-16 01:33:09', '2025-03-16 01:33:09'),
(4, 'Hörmuschel-Austausch', '2025-03-16 01:33:30', '2025-03-16 01:33:30'),
(5, 'Lautsprecher-Austausch', '2025-03-16 01:33:43', '2025-03-16 01:33:43'),
(6, 'Kamera-Austausch', '2025-03-16 01:34:03', '2025-03-16 01:34:03'),
(7, 'Backcover-Austausch', '2025-03-16 01:34:17', '2025-03-16 01:34:17'),
(8, 'Gehäuse-Austausch', '2025-03-16 01:34:42', '2025-03-16 01:34:42'),
(9, 'Platinen Reparatur', '2025-03-16 01:35:35', '2025-03-16 01:35:35'),
(10, 'Sonstige Reparaturen', '2025-03-16 01:36:14', '2025-03-16 01:36:14'),
(11, 'Datenrettung und -übertragung', '2025-03-16 01:37:04', '2025-03-16 01:37:04'),
(12, 'Software Reparatur', '2025-03-16 01:38:23', '2025-03-16 01:38:23');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `store`
--

CREATE TABLE `store` (
  `store_id` int(11) NOT NULL,
  `store_name` varchar(255) NOT NULL,
  `store_phone` varchar(20) DEFAULT NULL,
  `store_email` varchar(255) DEFAULT NULL,
  `store_address` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `tickets`
--

CREATE TABLE `tickets` (
  `ticket_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `device_type_id` int(11) DEFAULT NULL,
  `device_brand_id` int(11) DEFAULT NULL,
  `device_model_id` int(11) DEFAULT NULL,
  `ticket_device_serial` varchar(255) DEFAULT NULL,
  `ticket_accessories` varchar(255) DEFAULT NULL,
  `ticket_spare_parts` text DEFAULT NULL,
  `ticket_advance_pay` decimal(10,2) DEFAULT 0.00,
  `ticket_notes` text DEFAULT NULL,
  `ticket_status` enum('pending','waiting_parts','repaired','not_repaired') NOT NULL DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ticket_delivered` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `ticket_logs`
--

CREATE TABLE `ticket_logs` (
  `log_id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `log_type` varchar(50) NOT NULL,
  `log_description` text NOT NULL,
  `log_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`log_details`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `ticket_operations`
--

CREATE TABLE `ticket_operations` (
  `ticket_operation_id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `operation_id` int(11) NOT NULL,
  `ticket_operation_price` decimal(10,2) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `user_name` varchar(50) NOT NULL,
  `user_password` varchar(255) NOT NULL,
  `user_email` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `user_role` enum('admin','user') NOT NULL DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `users`
--

INSERT INTO `users` (`user_id`, `user_name`, `user_password`, `user_email`, `created_at`, `updated_at`, `user_role`) VALUES
(1, 'admin', '$2b$10$vCSqi/VUdKmw9wqXZDFYguuVoCUrY5b6b0lzCV4gMICN8fzbofT8W', 'ahmetyurtsevergm@gmail.com', '2025-03-16 00:54:46', '2025-03-16 00:54:46', 'admin');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `user_sessions`
--


--
-- Dökümü yapılmış tablolar için indeksler
--

--
-- Tablo için indeksler `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`customer_id`);

--
-- Tablo için indeksler `device_brands`
--
ALTER TABLE `device_brands`
  ADD PRIMARY KEY (`device_brand_id`),
  ADD UNIQUE KEY `device_brand_name` (`device_brand_name`);

--
-- Tablo için indeksler `device_models`
--
ALTER TABLE `device_models`
  ADD PRIMARY KEY (`device_model_id`),
  ADD UNIQUE KEY `device_model_name` (`device_model_name`),
  ADD KEY `fk_device_model_type` (`device_type_id`),
  ADD KEY `fk_device_model_brand` (`device_brand_id`);

--
-- Tablo için indeksler `device_types`
--
ALTER TABLE `device_types`
  ADD PRIMARY KEY (`device_type_id`),
  ADD UNIQUE KEY `device_type_name` (`device_type_name`),
  ADD KEY `fk_device_type_brand` (`device_brand_id`);

--
-- Tablo için indeksler `operations`
--
ALTER TABLE `operations`
  ADD PRIMARY KEY (`operation_id`),
  ADD UNIQUE KEY `operation_name` (`operation_name`);

--
-- Tablo için indeksler `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Tablo için indeksler `store`
--
ALTER TABLE `store`
  ADD PRIMARY KEY (`store_id`);

--
-- Tablo için indeksler `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`ticket_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `device_type_id` (`device_type_id`),
  ADD KEY `device_brand_id` (`device_brand_id`),
  ADD KEY `device_model_id` (`device_model_id`);

--
-- Tablo için indeksler `ticket_logs`
--
ALTER TABLE `ticket_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `ticket_logs_ticket_id_fk` (`ticket_id`),
  ADD KEY `ticket_logs_user_id_fk` (`user_id`);

--
-- Tablo için indeksler `ticket_operations`
--
ALTER TABLE `ticket_operations`
  ADD PRIMARY KEY (`ticket_operation_id`),
  ADD KEY `ticket_id` (`ticket_id`),
  ADD KEY `operation_id` (`operation_id`);

--
-- Tablo için indeksler `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `user_name` (`user_name`),
  ADD UNIQUE KEY `user_email` (`user_email`);

--
-- Tablo için indeksler `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Dökümü yapılmış tablolar için AUTO_INCREMENT değeri
--

--
-- Tablo için AUTO_INCREMENT değeri `customers`
--
ALTER TABLE `customers`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Tablo için AUTO_INCREMENT değeri `device_brands`
--
ALTER TABLE `device_brands`
  MODIFY `device_brand_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Tablo için AUTO_INCREMENT değeri `device_models`
--
ALTER TABLE `device_models`
  MODIFY `device_model_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- Tablo için AUTO_INCREMENT değeri `device_types`
--
ALTER TABLE `device_types`
  MODIFY `device_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- Tablo için AUTO_INCREMENT değeri `operations`
--
ALTER TABLE `operations`
  MODIFY `operation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Tablo için AUTO_INCREMENT değeri `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Tablo için AUTO_INCREMENT değeri `store`
--
ALTER TABLE `store`
  MODIFY `store_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Tablo için AUTO_INCREMENT değeri `tickets`
--
ALTER TABLE `tickets`
  MODIFY `ticket_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Tablo için AUTO_INCREMENT değeri `ticket_logs`
--
ALTER TABLE `ticket_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Tablo için AUTO_INCREMENT değeri `ticket_operations`
--
ALTER TABLE `ticket_operations`
  MODIFY `ticket_operation_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Tablo için AUTO_INCREMENT değeri `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Tablo için AUTO_INCREMENT değeri `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Dökümü yapılmış tablolar için kısıtlamalar
--

--
-- Tablo kısıtlamaları `device_models`
--
ALTER TABLE `device_models`
  ADD CONSTRAINT `fk_device_model_brand` FOREIGN KEY (`device_brand_id`) REFERENCES `device_brands` (`device_brand_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_device_model_type` FOREIGN KEY (`device_type_id`) REFERENCES `device_types` (`device_type_id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `device_types`
--
ALTER TABLE `device_types`
  ADD CONSTRAINT `fk_device_type_brand` FOREIGN KEY (`device_brand_id`) REFERENCES `device_brands` (`device_brand_id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `tickets`
--
ALTER TABLE `tickets`
  ADD CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tickets_ibfk_2` FOREIGN KEY (`device_type_id`) REFERENCES `device_types` (`device_type_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tickets_ibfk_3` FOREIGN KEY (`device_brand_id`) REFERENCES `device_brands` (`device_brand_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tickets_ibfk_4` FOREIGN KEY (`device_model_id`) REFERENCES `device_models` (`device_model_id`) ON DELETE SET NULL;

--
-- Tablo kısıtlamaları `ticket_logs`
--
ALTER TABLE `ticket_logs`
  ADD CONSTRAINT `ticket_logs_ticket_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`ticket_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ticket_logs_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Tablo kısıtlamaları `ticket_operations`
--
ALTER TABLE `ticket_operations`
  ADD CONSTRAINT `ticket_operations_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`ticket_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ticket_operations_ibfk_2` FOREIGN KEY (`operation_id`) REFERENCES `operations` (`operation_id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
