import React, { useState } from 'react';
import styles from './FAQGrid.module.css';
import FAQModal from './FAQModal';
import { faqItemsPresencial, faqItemsOnline, FAQItem } from './faqData';

interface FAQGridProps {
    modality?: string;
    onClose?: () => void;
    onCreateTicket?: () => void;
}

export default function FAQGrid({ modality, onClose, onCreateTicket }: FAQGridProps) {
    const [selectedItem, setSelectedItem] = useState<FAQItem | null>(null);

    // Determine which items to show based on modality
    // Assuming 'Remota' or 'Online' implies the Online FAQ
    const isOnline = modality && (
        modality.toLowerCase().includes('remota') ||
        modality.toLowerCase().includes('online') ||
        modality.toLowerCase().includes('vespertina') // Adjust based on exact values if known
    );

    const faqItems = isOnline ? faqItemsOnline : faqItemsPresencial;

    return (
        <div className={styles.container}>
            <div className={styles.faqGrid}>
                {faqItems.map((item, index) => (
                    <div
                        key={index}
                        className={styles.faqCard}
                        onClick={() => setSelectedItem(item)}
                        style={{ borderLeft: `6px solid ${item.color}` }}
                    >
                        <div className={styles.cardHeader}>
                            {item.icon && (
                                <span className={styles.icon} style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                                    {item.icon}
                                </span>
                            )}
                            <h3 className={styles.faqTitle}>{item.title}</h3>
                        </div>
                        <p className={styles.faqDescription}>{item.description}</p>
                        <span className={styles.viewMore} style={{ color: item.color }}>
                            Ver preguntas &rarr;
                        </span>
                    </div>
                ))}
            </div>

            {selectedItem && (
                <FAQModal
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                    title={selectedItem.title}
                    icon={selectedItem.icon}
                    description={selectedItem.description}
                    questions={selectedItem.questions}
                    generalResponse={selectedItem.generalResponse}
                    images={selectedItem.images}
                    video={selectedItem.video}
                    onCreateTicket={onCreateTicket}
                />
            )}
        </div>
    );
}
