UPDATE event_photos
  SET url = REPLACE(url, 'http://camshare.uplisoft.com', 'https://camshare.uplisoft.com')
  WHERE url LIKE 'http://camshare.uplisoft.com%';

UPDATE events
  SET cover_image_url = REPLACE(cover_image_url, 'http://camshare.uplisoft.com', 'https://camshare.uplisoft.com')
  WHERE cover_image_url LIKE 'http://camshare.uplisoft.com%';

UPDATE product_images
  SET url = REPLACE(url, 'http://camshare.uplisoft.com', 'https://camshare.uplisoft.com')
  WHERE url LIKE 'http://camshare.uplisoft.com%';

UPDATE user_details
  SET avatar_url = REPLACE(avatar_url, 'http://camshare.uplisoft.com', 'https://camshare.uplisoft.com')
  WHERE avatar_url LIKE 'http://camshare.uplisoft.com%';
