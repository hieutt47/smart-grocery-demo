import {useState} from 'react';
import {RECIPE_PHOTOS} from './recipe-photos';

export function RecipePhotoCredit({recipeId}: {recipeId: string}) {
  const photo = Object.hasOwn(RECIPE_PHOTOS, recipeId) ? RECIPE_PHOTOS[recipeId] : undefined;
  if (!photo) return null;
  return (
    <p className="recipe-photo-credit">
      Ảnh: <a href={photo.attributionUrl || photo.source}>{photo.author}</a>
      {' · '}<a href={photo.licenseUrl}>{photo.license}</a>
      {' · '}Thu nhỏ, chuyển WebP và cắt khung hiển thị.
    </p>
  );
}

export function RecipeVisual({
  recipe,
  className = 'recipe-photo-cover',
  decorative = false,
  eager = false
}: {
  recipe: {id: string; name: string; emoji?: string; color?: string};
  className?: string;
  decorative?: boolean;
  eager?: boolean;
}) {
  const photo = Object.hasOwn(RECIPE_PHOTOS, recipe.id) ? RECIPE_PHOTOS[recipe.id] : undefined;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const available = photo && failedSource !== photo.large;

  return (
    <div
      className={`recipe-art-wrap ${available ? 'recipe-photo-frame' : 'recipe-photo-fallback'} ${className}`}
      data-recipe-id={recipe.id}
      data-photo-status={available ? 'available' : 'missing'}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : available ? `Ảnh món ${recipe.name}` : `${recipe.name}: chưa có ảnh món ăn`}
      aria-hidden={decorative ? true : undefined}
    >
      {available ? (
        <img
          src={photo.large}
          srcSet={`${photo.small} ${photo.smallWidth}w, ${photo.large} ${photo.width}w`}
          sizes="(max-width: 680px) calc(100vw - 48px), (max-width: 1100px) 50vw, 420px"
          width={photo.width}
          height={photo.height}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
          style={{objectPosition: photo.position || 'center'}}
          onError={() => setFailedSource(photo.large)}
        />
      ) : <span className="recipe-photo-missing-text">Chưa có ảnh món ăn</span>}
    </div>
  );
}
