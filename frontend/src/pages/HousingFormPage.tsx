import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { housingApi } from '../api/housing';
import { housingPhotosApi } from '../api/housingPhotos';
import { extractErrorMessage } from '../api/errors';
import { AuthImage } from '../components/AuthImage';
import { CITIES, HOUSE_TYPE_LABELS, HOUSE_TYPES, formatEnumLabel } from '../constants/enumOptions';
import type { City, HouseType, HousingPhotoResponse, HousingRequest, HousingResponse } from '../types';

// Mirrors HousingRequest on the backend
const MAX_TEXT_LENGTH = 100;
// @Digits(integer = 8, fraction = 2); a comma is accepted as the decimal separator too
const AMOUNT_PATTERN = /^\d{1,8}([.,]\d{1,2})?$/;
const POST_CODE_PATTERN = /^\d{5}$/;
// same whitelist and limit as HousingPhotoService / spring.servlet.multipart.max-file-size
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

// Inputs keep strings, so a half-typed "12," is not turned into a number while typing
interface FormState {
  houseType: HouseType | '';
  title: string;
  coldRent: string;
  warmRent: string;
  area: string;
  deposit: string;
  city: City | '';
  postCode: string;
  street: string;
  content: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  houseType: '',
  title: '',
  coldRent: '',
  warmRent: '',
  area: '',
  deposit: '',
  city: '',
  postCode: '',
  street: '',
  content: '',
};

function toFormState(housing: HousingResponse): FormState {
  return {
    houseType: housing.houseType,
    title: housing.title,
    coldRent: String(housing.coldRent),
    warmRent: String(housing.warmRent),
    area: String(housing.area),
    deposit: housing.deposit === null ? '' : String(housing.deposit),
    city: housing.city,
    postCode: housing.postCode,
    street: housing.street,
    content: housing.content,
  };
}

const toNumber = (value: string) => Number(value.trim().replace(',', '.'));

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.houseType) errors.houseType = 'Choose a type.';
  if (!form.title.trim()) errors.title = 'Title is required.';
  else if (form.title.length > MAX_TEXT_LENGTH) errors.title = `At most ${MAX_TEXT_LENGTH} characters.`;

  const amount = (field: 'coldRent' | 'warmRent' | 'area' | 'deposit', optional = false) => {
    const value = form[field].trim();
    if (!value) {
      if (!optional) errors[field] = 'Required.';
      return;
    }
    if (!AMOUNT_PATTERN.test(value)) {
      errors[field] = 'A number with up to 8 digits and 2 decimals.';
    } else if (optional ? toNumber(value) < 0 : toNumber(value) <= 0) {
      errors[field] = optional ? 'Cannot be negative.' : 'Must be greater than 0.';
    }
  };
  amount('coldRent');
  amount('warmRent');
  amount('area');
  amount('deposit', true);

  if (!form.city) errors.city = 'Choose a city.';
  if (!POST_CODE_PATTERN.test(form.postCode.trim())) errors.postCode = 'Exactly 5 digits.';
  if (!form.street.trim()) errors.street = 'Street is required.';
  else if (form.street.length > MAX_TEXT_LENGTH) errors.street = `At most ${MAX_TEXT_LENGTH} characters.`;
  if (!form.content.trim()) errors.content = 'Tell people something about the place.';

  return errors;
}

// only called after validate() passed, so the enums are set and the numbers parse
function toRequest(form: FormState): HousingRequest {
  return {
    houseType: form.houseType as HouseType,
    title: form.title.trim(),
    coldRent: toNumber(form.coldRent),
    warmRent: toNumber(form.warmRent),
    area: toNumber(form.area),
    deposit: form.deposit.trim() ? toNumber(form.deposit) : null,
    city: form.city as City,
    postCode: form.postCode.trim(),
    street: form.street.trim(),
    content: form.content.trim(),
  };
}

// A selected file that is not uploaded yet; `error` is set when its upload failed
interface PendingPhoto {
  key: string;
  file: File;
  error?: string;
}

// passed via navigate() state when the listing was created but some photos failed
interface LocationState {
  failedUploads?: string[];
}

export function HousingFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== undefined;
  const navigate = useNavigate();
  const location = useLocation();
  const failedUploads = (location.state as LocationState | null)?.failedUploads ?? [];

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // edit mode: photos already on the server
  const [photos, setPhotos] = useState<HousingPhotoResponse[]>([]);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  // photos picked in this session, uploaded after the listing is saved
  const [pending, setPending] = useState<PendingPhoto[]>([]);

  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    const housingId = Number(id);
    Promise.all([housingApi.getById(housingId), housingPhotosApi.getPhotos(housingId)])
      .then(([housing, existingPhotos]) => {
        if (cancelled) return;
        setForm(toFormState(housing));
        setPhotos(existingPhotos);
      })
      .catch((err) => {
        if (!cancelled) setError(extractErrorMessage(err, 'Failed to load the listing.'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEditMode]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // the message disappears as soon as the user touches the field again
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleFilesSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    // reset, so picking the same file again still fires onChange
    e.target.value = '';
    setPending((prev) => [
      ...prev,
      ...files.map((file) => ({
        key: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        error: !PHOTO_TYPES.includes(file.type)
          ? 'Only JPEG, PNG or WebP.'
          : file.size > MAX_PHOTO_BYTES
            ? 'Larger than 8 MB.'
            : undefined,
      })),
    ]);
  };

  const removePending = (key: string) => setPending((prev) => prev.filter((p) => p.key !== key));

  const handleDeletePhoto = async (photoId: string) => {
    if (!isEditMode || !window.confirm('Delete this photo?')) return;
    setError(null);
    setDeletingPhotoId(photoId);
    try {
      await housingPhotosApi.deletePhoto(Number(id), photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not delete the photo.'));
    } finally {
      setDeletingPhotoId(null);
    }
  };

  // Uploads one by one, so a failure is tied to a file. Returns the photos that are still pending.
  const uploadPending = async (housingId: number): Promise<PendingPhoto[]> => {
    const left: PendingPhoto[] = [];
    for (const item of pending) {
      try {
        const uploaded = await housingPhotosApi.uploadPhoto(housingId, item.file);
        setPhotos((prev) => [...prev, uploaded]);
      } catch (err) {
        left.push({ ...item, error: extractErrorMessage(err, 'Upload failed.') });
      }
    }
    setPending(left);
    return left;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (pending.some((p) => p.error && !PHOTO_TYPES.includes(p.file.type))) {
      setError('Remove the photos marked as invalid first.');
      return;
    }
    if (pending.some((p) => p.file.size > MAX_PHOTO_BYTES)) {
      setError('Remove the photos marked as too large first.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const request = toRequest(form);
      const saved = isEditMode ? await housingApi.update(Number(id), request) : await housingApi.create(request);
      const failed = await uploadPending(saved.id);

      if (failed.length === 0) {
        navigate(`/housing/${saved.id}`, { replace: true });
      } else if (!isEditMode) {
        // the listing exists now: continue on its edit page, where the failed photos can be added again
        navigate(`/housing/${saved.id}/edit`, {
          replace: true,
          state: { failedUploads: failed.map((p) => `${p.file.name} (${p.error})`) } satisfies LocationState,
        });
      } else {
        setError('The listing was saved, but some photos could not be uploaded. Try again or remove them.');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to save the listing.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <p className="status-message">Loading...</p>;

  const fieldError = (field: keyof FormState) =>
    fieldErrors[field] && <span className="field-error">{fieldErrors[field]}</span>;

  return (
    <div className="page housing-form-page">
      <Link to={isEditMode ? `/housing/${id}` : '/housing'} className="back-link">
        ← {isEditMode ? 'Back to the listing' : 'Back to housing'}
      </Link>
      <h1>{isEditMode ? 'Edit listing' : 'Post a listing'}</h1>

      {failedUploads.length > 0 && (
        <div className="form-error">
          Your listing was published, but these photos could not be uploaded:
          <ul>
            {failedUploads.map((name) => <li key={name}>{name}</li>)}
          </ul>
          Add them again below and save.
        </div>
      )}

      <form onSubmit={handleSubmit} className="form housing-form" noValidate>
        <div className="form-row">
          <label>
            Type
            <select value={form.houseType} onChange={(e) => setField('houseType', e.target.value as HouseType | '')}>
              <option value="">Choose…</option>
              {HOUSE_TYPES.map((type) => (
                <option key={type} value={type}>{HOUSE_TYPE_LABELS[type]}</option>
              ))}
            </select>
            {fieldError('houseType')}
          </label>
          <label>
            City
            <select value={form.city} onChange={(e) => setField('city', e.target.value as City | '')}>
              <option value="">Choose…</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>{formatEnumLabel(city)}</option>
              ))}
            </select>
            {fieldError('city')}
          </label>
        </div>

        <label>
          Title
          <input
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            maxLength={MAX_TEXT_LENGTH}
            placeholder="e.g. Bright WG room close to campus"
          />
          {fieldError('title')}
        </label>

        <div className="form-row">
          <label>
            Street and number
            <input value={form.street} onChange={(e) => setField('street', e.target.value)} maxLength={MAX_TEXT_LENGTH} />
            {fieldError('street')}
          </label>
          <label>
            Post code
            <input
              value={form.postCode}
              onChange={(e) => setField('postCode', e.target.value)}
              inputMode="numeric"
              maxLength={5}
              placeholder="57072"
            />
            {fieldError('postCode')}
          </label>
        </div>

        <div className="form-row">
          <label>
            Warm rent (€ / month)
            <input value={form.warmRent} onChange={(e) => setField('warmRent', e.target.value)} inputMode="decimal" />
            {fieldError('warmRent')}
          </label>
          <label>
            Cold rent (€ / month)
            <input value={form.coldRent} onChange={(e) => setField('coldRent', e.target.value)} inputMode="decimal" />
            {fieldError('coldRent')}
          </label>
        </div>

        <div className="form-row">
          <label>
            Size (m²)
            <input value={form.area} onChange={(e) => setField('area', e.target.value)} inputMode="decimal" />
            {fieldError('area')}
          </label>
          <label>
            Deposit (€, optional)
            <input value={form.deposit} onChange={(e) => setField('deposit', e.target.value)} inputMode="decimal" />
            {fieldError('deposit')}
          </label>
        </div>

        <label>
          Description
          <textarea
            rows={8}
            value={form.content}
            onChange={(e) => setField('content', e.target.value)}
            placeholder="Move-in date, flatmates, furniture, how to reach the university…"
          />
          {fieldError('content')}
        </label>

        <fieldset className="photo-manager">
          <legend>Photos</legend>

          {photos.length > 0 && (
            <ul className="photo-grid">
              {photos.map((photo) => (
                <li key={photo.id} className="photo-tile">
                  <AuthImage photoId={photo.id} alt="Listing photo" className="photo-tile-img" />
                  <button
                    type="button"
                    className="photo-tile-remove"
                    onClick={() => handleDeletePhoto(photo.id)}
                    disabled={deletingPhotoId === photo.id}
                    aria-label="Delete photo"
                    title="Delete photo"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          {pending.length > 0 && (
            <ul className="pending-photos">
              {pending.map((item) => (
                <li key={item.key} className={item.error ? 'pending-photo pending-photo--error' : 'pending-photo'}>
                  <span className="pending-photo-name">{item.file.name}</span>
                  <span className="pending-photo-status">{item.error ?? 'will be uploaded on save'}</span>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => removePending(item.key)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <label className="button-ghost photo-picker">
            + Add photos
            <input type="file" accept={PHOTO_TYPES.join(',')} multiple onChange={handleFilesSelected} />
          </label>
          <span className="field-hint">JPEG, PNG or WebP, up to 8 MB each.</span>
        </fieldset>

        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditMode ? 'Save changes' : 'Publish listing'}
        </button>
      </form>
    </div>
  );
}
