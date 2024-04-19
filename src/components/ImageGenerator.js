import React, { useState, useEffect } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './ImageGenerator.css';

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');
  const [colorScheme, setColorScheme] = useState('');
  const [resolution, setResolution] = useState('');
  const [size, setSize] = useState('');
  const [images, setImages] = useState([]);

  const [selectedImages, setSelectedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCarousel, setShowCarousel] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [showNextBtn, setShowNextBtn] = useState(false);
  const [showBackBtn, setShowBackBtn] = useState(false);
  const [nextIsClicked, setNextIsClicked] = useState(false);
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [sendEmailResultText, setSendEmailResultText] = useState(false);
  const [sendEmailStatus, setSendEmailStatus] = useState(null);
  const [linkImage, setLinkImage] = useState(
    ''
    //    'https://storage.googleapis.com/dall-e-bucket/generatedImage_2024033113262.png'
  );
  const [idImage, setIdImage] = useState('');
  const [fName, setFName] = useState('');

  useEffect(() => {
    if (fName) {
      const performUploadAndApply = async () => {
        await applyImage();
        await uploadFile('downloaded');
      };
      performUploadAndApply();
    }
  }, [fName]); // Only re-run the effect if fName changes

  const containerStyle = {
    maxWidth: showCarousel ? 'none' : '500px',
    margin: 'auto',
  };

  const validateEmail = (email) => {
    setEmail(email);
    if (/\S+@\S+\.\S+/.test(email)) {
      setIsEmailValid(true);
    } else {
      setIsEmailValid(false);
    }
  };

  const handleGenerateImage = async () => {
    setIsLoading(true);
    setError('');
    setImageLoading(true);
    setShowCarousel(true);

    const enrichedPrompt = `${prompt}  on a white background | Style: ${style}, Color Scheme: ${colorScheme}, Resolution: ${resolution}, Size: ${size}`;
    const apiUrl =
      process.env.REACT_APP_IMAGE_GENERATION_API_URL ||
      'http://localhost:3000/generate-image';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: enrichedPrompt }),
      });
      const data = await response.json();
      if (data.message && data.message.fileName) {
        setFName(data.message.fileName); // State update; next steps will be handled in useEffect
      } else {
        throw new Error('No image data received');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setImageLoading(false);
      setIsLoading(false);
    }
  };

  const uploadFile = async (type) => {
    const apiUrl = 'http://localhost:3000/upload-image';
    const downloadedFName = fName.replace('.jpg', '_cropped.png');
    console.log('downloadedFName', downloadedFName);
    const fileName =
      type === 'downloaded' ? downloadedFName : fName.replace('.', '_output.');
    console.log('fileName_test', fileName);
    try {
      setImageLoading(true);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData: fileName,
          type: type,
        }),
      });
      const data = await response.json();
      if (data) {
        setLinkImage(`https://storage.googleapis.com/dall-e-bucket/${fName}`);
      } else {
        throw new Error('File is not uploaded');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setImageLoading(false);
    }
  };

  const applyImage = async () => {
    const apiUrl = 'http://localhost:3000/apply-image';
    try {
      setImageLoading(true);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ outputImageName: fName }),
      });
      const data = await response.json();
      if (data) {
        console.log('ApplyImageData:', data);
        await uploadFile('output');
        setTimeout(() => {
          const arr = [...images];
          const nImg = `https://storage.googleapis.com/dall-e-bucket/${fName.replace(
            '.',
            '_output.'
          )}`;
          arr.push(nImg);
          setImages(arr);
          console.log('images!!!!', images);
        }, 5000);
      } else {
        throw new Error('File is not uploaded');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setImageLoading(false);
    }
  };

  useEffect(() => {
    selectedImages.length > 0 ? setShowNextBtn(true) : setShowNextBtn(false);
  }, [selectedImages]);

  const nextAction = () => {
    setNextIsClicked(true);
    setShowNextBtn(false);
    setShowBackBtn(true);
  };

  const backAction = () => {
    setSendEmailResultText(false);
    setSendEmailStatus(null);
    setNextIsClicked(false);
    setShowNextBtn(true);
    setShowBackBtn(false);
  };

  const sendEmail = async () => {
    setIsEmailSending(true);
    const apiEmail = 'http://localhost:3000/send-email';

    fetch(apiEmail, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email, size: size, links: selectedImages }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data && data.error) {
          setSendEmailStatus('ERROR');
        } else {
          setSendEmailStatus('OK');
        }
        setSendEmailResultText(data.message);
        console.log('data', data);
      })
      .catch((error) => {
        setSendEmailStatus('ERROR');
        console.error('Error:', error);
        setSendEmailResultText(error.message);
        setError(error.message);
      })
      .finally(() => {
        setIsEmailSending(false);
      });
  };

  const toggleSelectImage = (imageUrl) => {
    setSelectedImages((prevSelectedImages) => {
      if (prevSelectedImages.includes(imageUrl)) {
        return prevSelectedImages.filter((image) => image !== imageUrl);
      } else {
        return [...prevSelectedImages, imageUrl];
      }
    });
  };

  return (
    <div className="questionnary-container">
      <div
        className="container mt-5"
        style={!showCarousel ? containerStyle : null}
      >
        <div className="row">
          {!nextIsClicked && (
            <div className="col-md-6">
              <h2>Customize your T-shirt</h2>
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              {/* Rest of the questionnaire */}
              <div className="mb-3">
                <label htmlFor="style">
                  Style:{' '}
                  <i
                    className="bi bi-asterisk"
                    style={{ color: 'red', fontSize: '10px' }}
                    title="required"
                  ></i>
                </label>
                <select
                  required
                  className="form-select"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                >
                  <option value="" disabled>
                    Select Style
                  </option>
                  <option value="classic">Classic</option>
                  <option value="modern">Modern</option>
                  <option value="abstract">Abstract</option>
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="style">
                  Color Scheme:{' '}
                  <i
                    className="bi bi-asterisk"
                    style={{ color: 'red', fontSize: '10px' }}
                    title="required"
                  ></i>
                </label>
                <select
                  required
                  className="form-select"
                  value={colorScheme}
                  onChange={(e) => setColorScheme(e.target.value)}
                >
                  <option value="" disabled>
                    Select Color Scheme
                  </option>
                  <option value="colorful">Colorful</option>
                  <option value="monochrome">Monochrome</option>
                  <option value="pastel">Pastel</option>
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="style">
                  Resolution:{' '}
                  <i
                    className="bi bi-asterisk"
                    style={{ color: 'red', fontSize: '10px' }}
                    title="required"
                  ></i>
                </label>
                <select
                  required
                  className="form-select"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                >
                  <option value="" disabled>
                    Select Resolution
                  </option>
                  <option value="standard">Standard</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="mb-3">
                <textarea
                  className="form-control"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter any additional information"
                  aria-label="Enter any additional information"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {!nextIsClicked && (
                  <button
                    className="btn btn-primary"
                    onClick={handleGenerateImage}
                    disabled={
                      isLoading || !colorScheme || !style || !resolution
                    }
                  >
                    {isLoading ? 'Generating...' : 'Generate Image'}
                  </button>
                )}
                {showNextBtn && (
                  <button className="btn btn-secondary" onClick={nextAction}>
                    Next
                  </button>
                )}
              </div>
            </div>
          )}
          {nextIsClicked && (
            <div className="col-md-6">
              <h2>Send Email</h2>
              {sendEmailResultText && sendEmailStatus === 'OK' && (
                <div className={`alert alert-success`} role="alert">
                  {sendEmailResultText}
                </div>
              )}

              {sendEmailResultText && sendEmailStatus === 'ERROR' && (
                <div className={`alert alert-danger`} role="alert">
                  {sendEmailResultText}
                </div>
              )}

              <div className="mb-3">
                <label htmlFor="email">
                  Email:{' '}
                  <i
                    className="bi bi-asterisk"
                    style={{ color: 'red', fontSize: '12px' }}
                    title="required"
                  >
                    {!isEmailValid ? 'Please, check email' : null}
                  </i>
                </label>
                <input
                  value={email}
                  required
                  className="form-control"
                  placeholder="name@example.com"
                  onChange={(e) => validateEmail(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="style">
                  T-shirt size:{' '}
                  <i
                    className="bi bi-asterisk"
                    style={{ color: 'red', fontSize: '10px' }}
                    title="required"
                  ></i>
                </label>
                <select
                  required
                  className="form-select"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                >
                  <option value="" disabled>
                    Select Size
                  </option>
                  <option value="sm-size">S/M</option>
                  <option value="ml-size">M/L</option>
                  <option value="lxl-size">L/XL</option>
                  <option value="xlxxl-size">XL/XXL</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {isEmailValid && size && showBackBtn && (
                  <button className="btn btn-secondary" onClick={sendEmail}>
                    {isEmailSending ? 'Sending Email...' : 'Send Email'}
                  </button>
                )}
                {showBackBtn && (
                  <button className="btn btn-secondary" onClick={backAction}>
                    Back
                  </button>
                )}
              </div>
            </div>
          )}
          {showCarousel && (
            <div className="col-md-6">
              {imageLoading ? (
                <div
                  className="spinner-border"
                  style={{ width: '3rem', height: '3rem' }}
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : images.length > 0 ? (
                <div
                  id="imageCarousel"
                  className="carousel slide"
                  data-bs-ride="carousel"
                >
                  <div className="carousel-inner">
                    {images.map((image, index) => (
                      <div
                        key={image}
                        className={`carousel-item ${
                          index === 0 ? 'active' : ''
                        }`}
                      >
                        <img
                          src={image}
                          className="d-block w-100"
                          alt={`Generated ${index + 1}`}
                        />
                        {!nextIsClicked && (
                          <div className="carousel-caption d-none d-md-block">
                            <button
                              className={'btn btn-success'}
                              onClick={() =>
                                toggleSelectImage(
                                  image.replace('output.jpg', 'cropped.png')
                                )
                              }
                            >
                              {selectedImages.includes(image)
                                ? 'Deselect'
                                : 'Select'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    className="carousel-control-prev"
                    type="button"
                    data-bs-target="#imageCarousel"
                    data-bs-slide="prev"
                  >
                    <span
                      className="carousel-control-prev-icon"
                      aria-hidden="true"
                    ></span>
                    <span className="visually-hidden">Previous</span>
                  </button>
                  <button
                    className="carousel-control-next"
                    type="button"
                    data-bs-target="#imageCarousel"
                    data-bs-slide="next"
                  >
                    <span
                      className="carousel-control-next-icon"
                      aria-hidden="true"
                    ></span>
                    <span className="visually-hidden">Next</span>
                  </button>
                </div>
              ) : (
                <p>No images generated yet.</p>
              )}
              {selectedImages.length > 0 && ( // This block is now directly under the carousel within the same column.
                <div className="mt-4">
                  <h4>Selected Images</h4>
                  <div className="d-flex flex-wrap">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="m-2">
                        <img
                          src={image}
                          className="img-thumbnail"
                          alt={`Selected ${index + 1}`}
                          style={{ maxWidth: '100px', maxHeight: '100px' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
