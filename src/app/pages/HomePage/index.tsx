import { DataItem } from 'app/components/DataItem';
import { database, storage } from 'app/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  DocumentData,
  DocumentReference,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  listAll,
  ref as storageRef,
  uploadBytes,
} from 'firebase/storage';
import * as React from 'react';
import { Helmet } from 'react-helmet-async';
import { toast, ToastContainer } from 'react-toastify';
import lottie from 'lottie-web';
import './ReactToastify.css';

enum DataType {
  Text = 'string',
  Image = 'image',
}

interface Data {
  data: string;
  type: DataType;
  timestamp: number;
}

const COLLECTION_LIMIT = 10;

export function HomePage() {
  const ref = collection(database, 'syncs');

  const imagesRef = storageRef(storage, 'images');

  const animRef = React.useRef<any>();

  const [data, setData] = React.useState<Data[]>();
  const [loading, setLoading] = React.useState(false);

  const [lastDoc, setLastDoc] =
    React.useState<DocumentReference<DocumentData, DocumentData>>();

  const addItem = React.useCallback(
    (item: Data) => {
      setLoading(true);

      if (lastDoc) {
        setDoc(lastDoc, item).finally(() => {
          setLoading(false);
        });
      } else {
        addDoc(ref, item).finally(() => {
          setLoading(false);
        });
      }
    },
    [lastDoc, ref],
  );

  const addText = React.useCallback(
    (text: string) => {
      addItem({ type: DataType.Text, data: text, timestamp: Date.now() });
    },
    [addItem],
  );

  const addImg = React.useCallback(
    (file: File) => {
      setLoading(true);
      uploadBytes(imagesRef, file)
        .then(snapshot => {
          console.log('Uploaded a blob or file!');
          getDownloadURL(snapshot.ref).then(downloadURL => {
            console.log('File available at', downloadURL);
            addItem({
              type: DataType.Image,
              data: downloadURL,
              timestamp: Date.now(),
            });
          });
        })
        .catch(error => console.log('$fail to upload file', file))
        .finally(() => {
          setLoading(false);
        });
    },
    [addItem, imagesRef],
  );

  React.useEffect(() => {
    const q = query(ref, orderBy('timestamp', 'desc'), limit(10));
    const unsub = onSnapshot(q, snapshot => {
      const listData = snapshot.docs.map(data => data.data() as Data);
      if (listData.length >= COLLECTION_LIMIT) {
        setLastDoc(snapshot.docs[listData.length - 1].ref);
      } else {
        setLastDoc(undefined);
      }
      setData(listData);
      console.log('$setting data');
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    document.body.onpaste = (event: ClipboardEvent) => {
      const data = event.clipboardData?.items;
      if (!data) {
        console.log('DATA NULL', event);
        return;
      }
      for (let i = 0; i < data.length; i += 1) {
        if (data[i].kind === 'string' && data[i].type.match('^text/plain')) {
          data[i].getAsString(str => {
            console.log('text/plain', str);
            addText(str);
          });
        } else if (
          data[i].kind === 'string' &&
          data[i].type.match('^text/html')
        ) {
          data[i].getAsString(str => console.log('html', str));
        } else if (
          data[i].kind === 'string' &&
          data[i].type.match('^text/uri-list')
        ) {
          data[i].getAsString(str => console.log('uri', str));
        } else if (data[i].kind === 'file' && data[i].type.match('^image/')) {
          const f = data[i].getAsFile();
          if (!f) {
            console.log('$file error');
            return;
          }
          try {
            addImg(f);
            console.log('File', f, window.URL.createObjectURL(f as Blob));
          } catch (error) {
            console.log('$file error', error);
          }
        }
      }
    };
  }, [addImg, addText]);

  const copy = React.useCallback((item: Data) => {
    navigator.clipboard
      .writeText(item.data)
      .then(() => {
        toast('Copied!', {
          position: 'top-right',
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'light',
          type: 'success',
        });
      })
      .catch(e => {
        toast('Copy Failed! ' + e, { type: 'error' });
      });
  }, []);

  const clearStoreage = React.useCallback(async () => {
    const listResults = await listAll(imagesRef);
    const promises = listResults.items.map(item => {
      return deleteObject(item);
    });
    return Promise.all(promises);
  }, [imagesRef]);

  const clearColletion = React.useCallback(async () => {
    const listResults = await getDocs(ref);
    const promises: Promise<void>[] = [];

    listResults.forEach(item => {
      promises.push(deleteDoc(item.ref));
    });

    return Promise.all(promises);
  }, [ref]);

  const clearData = React.useCallback(async () => {
    try {
      setLoading(true);
      await clearColletion();
      await clearStoreage();

      toast('Clear success!', {
        position: 'top-right',
        autoClose: 2000,
        type: 'success',
      });
      setLoading(false);
    } catch (error) {
      toast('Clear Failed! ' + error, {
        position: 'top-right',
        autoClose: 2000,
        type: 'error',
      });
      setLoading(false);
    }
  }, [clearColletion, clearStoreage]);

  React.useEffect(() => {
    if (!animRef.current) {
      console.log('$loadAnimation');
      animRef.current = lottie.loadAnimation({
        container: document.querySelector('#lottie')!,
        renderer: 'canvas',
        autoplay: true,
        path: './animation_ln7cyycb.json',
      });
    }
  }, []);

  React.useEffect(() => {
    if (loading) {
      animRef?.current?.play();
    } else {
      animRef?.current?.pause();
    }
  }, [loading]);

  console.log('$rendering');

  return (
    <>
      <Helmet>
        <title>Home</title>
        <meta name="description" content="A Boilerplate application homepage" />
      </Helmet>
      <div>
        <button onClick={clearData}>Clear data</button>
      </div>
      {data &&
        data.map((item, index) => {
          const randomColor =
            '#' + Math.floor(Math.random() * 16777215).toString(16) + '55';
          return (
            <DataItem
              key={item.timestamp ?? index}
              style={{
                background: item.type === DataType.Text ? randomColor : 'white',
              }}
              onClick={() => copy(item)}
            >
              {item.type === DataType.Text ? (
                item.data
              ) : (
                <img
                  src={item.data}
                  alt={'image' + index}
                  style={{ maxWidth: 500 }}
                />
              )}
            </DataItem>
          );
        })}
      <ToastContainer />
      <div
        id="lottie"
        style={{
          width: 300,
          height: loading ? 300 : 0,
          position: 'absolute',
          left: 0,
          right: 0,
          margin: 'auto',
        }}
      />
    </>
  );
}
