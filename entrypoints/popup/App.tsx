import { useState, useEffect, ChangeEvent, DragEvent } from 'react';
import './App.css';
import { createPage, getPages, RandomIdea } from './action';

export interface SerializableFile {
  filename: string;
  contentType: string;
  base64Data: string; 
}

function App() {
  const [showAddIdea, setShowAddIdea] = useState(false);
  const [showGetIdea, setShowGetIdea] = useState(false);

  const [page, setPage] = useState<RandomIdea|null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [links, setLinks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [statusMessage, setStatusMessage] = useState('');

  const fileToSerializable = (file: File): Promise<SerializableFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64Data = reader.result.split(',')[1];
          resolve({
            filename: file.name,
            contentType: file.type,
            base64Data,
          });
        } else {
          reject(new Error(`Failed to parse file: ${file.name}`));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const loadPage = async () => {
      try {
        const response = await getPages();
        setPage(response);
      } catch (error) {
        console.error('Failed to fetch page', error);
      }
    };

    void loadPage();
  }, []);

  const handleAddToNotion = async () => {
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('Encoding image binaries...');

    try {
      const encodedImages = await Promise.all(
        selectedFiles.map(file => fileToSerializable(file))
      );

      setStatusMessage('Sending to Notion...');

      await createPage({ 
        title, 
        description, 
        links, 
        localImages: encodedImages 
      });
      
      alert('Idea successfully added to Notion!');
      
      // Reset layout and states
      setTitle('');
      setDescription('');
      setLinks('');
      setSelectedFiles([]);
      setStatusMessage('');
      setShowAddIdea(false);
    } catch (error) {
      console.error("Failed to add page:", error);
      alert(error instanceof Error ? error.message : "Error adding page to Notion.");
      setStatusMessage('Upload failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {!(showAddIdea || showGetIdea) && 
        <div className='card'>  
          <button className='btn' onClick={() => setShowAddIdea(true)}>
            Add Idea
          </button>
          <button className='btn' onClick={() => setShowGetIdea(true)}>
            Get Idea
          </button>
        </div>
      }
      {showAddIdea &&
        <div className='card'>
          <div>
            <label className='formLabel'>Title *:</label>
            <input
              type="text"
              id="title"
              name="title"
              value={title}
              required
              size={50}
              className='formInput'
              onChange={(e) => setTitle(e.target.value)} 
            />
          </div>

          <div>
            <label className='formLabel'>Description:</label>
            <textarea 
              id="description" 
              name="description" 
              value={description}
              rows={4} 
              cols={40} 
              className='formInput'
              placeholder="Type your ideas here..." 
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>



          <div>
            <label className='formLabel'>Links:</label>
            <textarea 
              id="links" 
              name="links" 
              value={links}
              rows={2} 
              cols={40} 
              className='formInput'
              placeholder="Add any relevant links" 
              onChange={(e) => setLinks(e.target.value)}
            />
          </div>

          <div>
            <label className='formLabel'>Images:</label>
            <div
              className='imageUpload'
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className='inner'
              />
              <p style={{ color: '#6366f1', fontWeight: 'bold' }}>Browse and upload image</p>
            </div>
          </div>
          {selectedFiles.length > 0 && (
            <div className='queue'>
              <div className='formLabel'>
                Queue ({selectedFiles.length})
              </div>
              {selectedFiles.map((file, index) => (
                <div key={index} className='imageRow'>
                  <span className='fileName'>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className='deleteRow'
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {statusMessage && (
            <div style={{ fontSize: '12px', color: '#4b5563', fontStyle: 'italic', textAlign: 'center' }}>
              {statusMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className='btn' onClick={handleAddToNotion} disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add to Notion'}
            </button>
            <button className='secondaryBtn' onClick={() => { setShowAddIdea(false); setSelectedFiles([]); setStatusMessage(''); }}>
              Go Home
            </button>
          </div>
        </div>
      }
      {showGetIdea && 
        <div>
          <p>here's a project: <a href={page?.url} target="_blank" className='hyperlink'>{page?.title}</a></p>
          <button className='secondaryBtn' onClick={() => setShowGetIdea(false)}>
            Go Home
          </button>
        </div>
      }
    </>
  );
}

export default App;
